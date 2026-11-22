"""The machinery that turns definitions into types (js/src/registry.js): a class
per semantic type, the catalog over a set of definitions, extend() and type_of().

The definitions themselves are data/catalog.json, generated from the JavaScript
types, so both languages describe every type identically."""
from __future__ import annotations

import copy
import importlib
import importlib.util
import re
from collections.abc import Mapping

from . import _data
from ._lib import js
from ._lib.errors import ValidationError

# ---------------------------------------------------------------------------
# Immutable values


class FrozenDict(dict):
    """A dict that refuses to change: the stored form of an object value.
    It is still a dict, so json.dumps() and ``==`` treat it as one."""
    __slots__ = ()

    def __init__(self, *args, **kwargs):  # filled by __new__ / _frozen()
        pass

    def _readonly(self, *args, **kwargs):
        raise TypeError(f'{type(self).__name__} is immutable')

    __setitem__ = __delitem__ = __ior__ = _readonly
    clear = pop = popitem = setdefault = update = _readonly

    def __hash__(self):
        return hash(tuple(sorted((k, _hashable(v)) for k, v in self.items())))

    def __repr__(self):
        return f'{type(self).__name__}({dict.__repr__(self)})'

    def __reduce__(self):
        return (_frozen, (_plain(self),))

    def __copy__(self):
        return self

    def __deepcopy__(self, memo):
        return self


def _hashable(value):
    return tuple(_hashable(v) for v in value) if isinstance(value, (list, tuple)) else value


def _frozen(value):
    """A canonical value frozen all the way down: lists become tuples, dicts FrozenDicts."""
    if isinstance(value, Value):
        return value
    if isinstance(value, (list, tuple)):
        return tuple(_frozen(v) for v in value)
    if isinstance(value, Mapping):
        out = FrozenDict()
        dict.update(out, ((k, _frozen(v)) for k, v in value.items()))
        return out
    return value


def _plain(value):
    """A value as plain JSON-like Python data: str, int, float, bool, None, list, dict."""
    if isinstance(value, bool) or value is None:
        return value
    if isinstance(value, str):
        return str.__str__(value)
    if isinstance(value, int):
        return int(value)
    if isinstance(value, float):
        return float(value)
    if isinstance(value, (list, tuple)):
        return [_plain(v) for v in value]
    if isinstance(value, Mapping):
        return {k: _plain(v) for k, v in value.items()}
    return value


def _wire(value):
    """Numbers as JSON carries them: whole floats become ints, as JS writes them."""
    t = type(value)
    if t is str or value is None or t is bool:
        return value
    if js.is_number(value):
        return js.wire_number(value)
    if isinstance(value, list):
        return [_wire(v) for v in value]
    if isinstance(value, dict):
        return {k: _wire(v) for k, v in value.items()}
    return value


class Value:
    """The base of every value a type returns: ``type_of(x)`` reads its type name, and
    ``x.value_of()`` the same value as built-in types (str, int, float, list, dict)."""
    __slots__ = ()
    _typeset_name = None

    def value_of(self):
        return _plain(self)

    def __repr__(self):
        return f'{type(self).__name__}({self.value_of()!r})'

    def __reduce__(self):
        return (_rebuild, (self._typeset_name, type(self).__name__, self.value_of()))

    def __copy__(self):
        return self

    def __deepcopy__(self, memo):
        return self

    @classmethod
    def __get_pydantic_core_schema__(cls, source, handler):
        """Pydantic: a field annotated with a type is normalized on input (a refusal is a
        pydantic validation error) and serialized as its plain value."""
        from pydantic_core import core_schema  # pydantic is optional: imported only by pydantic itself

        return core_schema.no_info_plain_validator_function(
            cls, serialization=core_schema.plain_serializer_function_ser_schema(_plain, when_used='always'))

    @classmethod
    def __get_pydantic_json_schema__(cls, schema, handler):
        """Pydantic's JSON Schema for the field: the type's own (to_json_schema())."""
        return cls._typeset_schema()


def _rebuild(name, class_name, value):
    # Unpickling rebuilds through the package's own catalog (`types`, below).
    Type = types.get(name)
    return Type(value)


def _unwrap(value):
    """An instance read as its plain value, so every type takes another's instance as input."""
    return value.value_of() if isinstance(value, Value) else value


def _input(value):
    """An input as normalize() and validate() read it: unwrapped, with ints outside
    JS's safe range as the doubles JS would read (methods keep exact ints, as
    JS methods take bigints)."""
    return js.js_value(_unwrap(value))


# ---------------------------------------------------------------------------
# Checking


def _same(a, b) -> bool:
    """Structural equality of plain JSON-like values; key order is ignored, and
    a bool never equals a number (as in JS)."""
    pending = [(a, b)]
    while pending:
        x, y = pending.pop()
        if isinstance(x, bool) or isinstance(y, bool):
            if not (isinstance(x, bool) and isinstance(y, bool) and x == y):
                return False
            continue
        if js.is_number(x) or js.is_number(y):
            if not (js.is_number(x) and js.is_number(y) and x == y):
                return False
            continue
        if isinstance(x, str) or isinstance(y, str) or x is None or y is None:
            if not (type(x) is type(y) or (isinstance(x, str) and isinstance(y, str))) or x != y:
                return False
            continue
        if js.is_array(x) and js.is_array(y):
            if len(x) != len(y):
                return False
            pending.extend(zip(x, y, strict=True))
            continue
        if isinstance(x, Mapping) and isinstance(y, Mapping):
            if len(x) != len(y) or any(k not in y for k in x):
                return False
            pending.extend((x[k], y[k]) for k in x)
            continue
        if x != y:
            return False
    return True


def _stores(storage, value) -> bool:
    """Whether a value has a storage's shape: what normalize() returns and validate() expects."""
    if storage == 'array':
        return js.is_array(value)
    if storage in ('object', 'any'):
        return isinstance(value, Mapping)
    if storage == 'string':
        return isinstance(value, str)
    if storage == 'number':
        return js.is_number(value)
    if storage == 'boolean':
        return isinstance(value, bool)
    if storage == 'bigint':
        return isinstance(value, int) and not isinstance(value, bool)
    return False


# What follows the path in a refusal: any deeper item path, then the words (JS \S).
_ISSUE_TAIL = re.compile(r'((?:\[[0-9]+\]|\.[A-Za-z0-9_$]+)*) (' + js.NOT_S + '.*)', re.S)


def _missing(value) -> bool:
    """Missing or empty input: check() reports it as 'required', whatever the type."""
    return value is None or (isinstance(value, str) and js.trim(value) == '')


def _issue_from(err, used, path, value):
    """A refusal as one {path, message, code} issue. Messages read "<path> must be ...";
    the path moves into ``path`` (deeper when the message names an item, like
    scopes[1]) and the message keeps only the words: "must be a valid email"."""
    message = str(err)
    code = 'required' if _missing(value) else getattr(err, 'code', 'invalid')
    lead = _ISSUE_TAIL.fullmatch(message, len(used)) if message.startswith(used) else None
    if not lead:
        return {'path': path, 'message': message, 'code': code}
    nested = path + lead[1] if path else re.sub(r'^\.', '', lead[1])
    return {'path': nested, 'message': lead[2], 'code': code}


# ---------------------------------------------------------------------------
# Optional dependencies

# The types that need an optional dependency: (the module it imports, the extra that installs it).
# Without it, every call raises the same ModuleNotFoundError, whatever the input, so a
# type never refuses junk and then fails on a valid value (as the JS lite build).
_EXTRAS = {
    'phone': ('phonenumbers', 'phone'),
    'javascript': ('py_mini_racer', 'code'), 'python': ('py_mini_racer', 'code'),
    'html': ('py_mini_racer', 'code'), 'css': ('py_mini_racer', 'code'), 'svg': ('py_mini_racer', 'code'),
}
_available = {}


def _require_extra(name):
    module, extra = _EXTRAS[name]
    if module not in _available:
        try:
            _available[module] = importlib.util.find_spec(module) is not None
        except (ImportError, ValueError):
            _available[module] = False
    if not _available[module]:
        raise ModuleNotFoundError(
            f"chadc00per-typeset: the {name} type needs {module}, an optional dependency; "
            f"install it with: pip install 'chadc00per-typeset[{extra}]'", name=module)


# ---------------------------------------------------------------------------
# Constructors

_BASES = {'string': str, 'bigint': int, 'array': tuple, 'object': FrozenDict}


def _constructor(info, implementation, details, class_name, schema_details=None, extra=False):
    name = info['name']
    noun = info['noun']
    storage = info['storage']
    if storage == 'number':
        # Whole-number types (a step of 1) are ints; the rest floats.
        base = int if info['ui'].get('step') == 1 else float
    elif storage == 'boolean':
        base = bool  # bool can't be subclassed: the class returns the plain True or False
    else:
        base = _BASES.get(storage)
    if base is None:
        raise TypeError(f'@chadc00per/typeset: "{name}" (storage {storage}) has no Python value type')
    impl_normalize = implementation['normalize']
    has_details = name in details

    # Whether the module's output is already in wire form (WIRED), read on first use.
    wired = []

    def normalize(value, path=None):
        """The canonical plain value for an input; raises ValidationError when refused."""
        if extra:
            _require_extra(name)
        canonical = impl_normalize(noun, _input(value), name if path is None else path)
        if not wired:
            wired.append(bool(implementation.get('wired')))
        return canonical if wired[0] else _wire(canonical)

    def validate(value, path=None):
        """Checks a stored value: it must already be exactly what normalize() returns for it."""
        if extra:
            _require_extra(name)
        path = name if path is None else path
        value = _input(value)
        impl_validate = implementation.get('validate')
        if impl_validate:
            impl_validate(noun, value, path)
            return None
        if not _stores(storage, value):
            raise ValidationError(f'{path} must be a valid {noun} (normalize input before validation)')
        if not _same(_wire(impl_normalize(noun, value, path)), value):
            raise ValidationError(f'{path} must be a valid {noun} (canonical value required)', 'canonical')
        return None

    def is_(value) -> bool:
        """Whether an input is accepted (JS ``Type.is``)."""
        try:
            normalize(value)
            return True
        except ValidationError:
            return False

    def check(value, path=''):
        """{'ok': True, 'value': canonical} or {'ok': False, 'issues': [{'path', 'message', 'code'}]}."""
        try:
            return {'ok': True, 'value': normalize(value, path or name)}
        except ValidationError as err:
            return {'ok': False, 'issues': [_issue_from(err, path or name, path, _unwrap(value))]}

    def describe():
        """The type's metadata: the same as the catalog's describe(name)."""
        out = copy.deepcopy(_thaw(info))
        if has_details:
            out['ui'].update(implementation['details'](name))
        return out

    def __new__(cls, value):
        canonical = normalize(value)
        # A value of the wrong shape would be stored as something else: an implementation bug.
        if not _stores('object' if base is FrozenDict else storage, canonical) or \
                (base is int and not isinstance(canonical, int)):
            raise TypeError(f'@chadc00per/typeset: "{name}" (storage {storage}) normalized to {type(canonical).__name__}')
        if base is bool:
            return canonical
        if base is FrozenDict:
            instance = dict.__new__(cls)
            dict.update(instance, ((k, _frozen(v)) for k, v in canonical.items()))
            return instance
        if base is tuple:
            return tuple.__new__(cls, (_frozen(v) for v in canonical))
        return base.__new__(cls, canonical)

    namespace = {
        '__slots__': (),
        '__new__': __new__,
        '__doc__': f"{info['description']}. Example: {info['example']}",
        '__module__': __package__,
        '_typeset_name': name,
        '_typeset_schema': staticmethod(lambda: _json_schema(_thaw(info), schema_details or {})),
        'to_json_schema': staticmethod(lambda: _json_schema(_thaw(info), schema_details or {})),
        '_typeset_extra': extra,
        'normalize': staticmethod(normalize),
        'validate': staticmethod(validate),
        'is_': staticmethod(is_),
        'check': staticmethod(check),
        'describe': staticmethod(describe),
    }
    if base is FrozenDict:
        namespace['__init__'] = lambda self, *args, **kwargs: None
    for field in ('name', 'label', 'noun', 'description', 'example', 'aliases', 'storage', 'wire', 'collation', 'constraints', 'ui'):
        namespace[field] = info[field]
    if has_details:
        namespace['details'] = staticmethod(lambda: implementation['details'](name))
    namespace['_typeset_implementation'] = implementation
    return _TypeMeta(class_name, (Value, int if base is bool else base), namespace)


class _TypeMeta(type):
    """A type class's metaclass: a type's own methods (TagSet.normalize_item,
    Scopes.level_of) are read from its implementation module on first use, so
    the module is imported only when something needs it."""

    def __getattr__(cls, attr):
        if attr.startswith('__') or '_typeset_implementation' not in cls.__dict__:
            raise AttributeError(attr)
        implementation = cls.__dict__['_typeset_implementation']
        methods = (implementation.get('methods') or {}).get(cls.__dict__['_typeset_name'], {})
        if attr not in methods:
            raise AttributeError(f"type object '{cls.__name__}' has no attribute '{attr}'")
        method = _unwrapping(methods[attr], cls.__dict__['_typeset_name'] if cls.__dict__.get('_typeset_extra') else None)
        setattr(cls, attr, staticmethod(method))
        return method

    def __dir__(cls):
        implementation = cls.__dict__.get('_typeset_implementation') or {}
        methods = (implementation.get('methods') or {}).get(cls.__dict__.get('_typeset_name'), {})
        return sorted(set(super().__dir__()) | set(methods))


def _unwrapping(method, extra=None):
    def call(*args, **kwargs):
        if extra:
            _require_extra(extra)
        if args:
            args = (_unwrap(args[0]), *args[1:])
        return method(*args, **kwargs)
    call.__name__ = getattr(method, '__name__', 'method')
    call.__doc__ = getattr(method, '__doc__', None)
    return call


def _thaw(value):
    if isinstance(value, Mapping):
        return {k: _thaw(v) for k, v in value.items()}
    if isinstance(value, tuple):
        return [_thaw(v) for v in value]
    return value


# ---------------------------------------------------------------------------
# The catalog


class Catalog:
    """The catalog over a set of definitions: ``names`` (the semantic types),
    ``all`` (every type, in picker order), ``aliases``, ``get(name)`` → a
    semantic type's class, ``describe(name=None)`` → plain metadata."""

    def __init__(self, *, definitions, aliases, modules, describe_aliases=None, details=(), labels=None, nouns=None,
                 controls=None, steps=None, options=None, class_names=None, json_schemas=None, inherit=lambda d: None):
        describe_aliases = describe_aliases or {}
        labels, controls, steps, choices = labels or {}, controls or {}, steps or {}, options or {}
        nouns = nouns or {}
        class_names = class_names or {}
        every_alias = {**aliases, **describe_aliases}
        self._metadata = {}
        self._types = {}
        for definition in definitions:
            name, description, example, implementation, storage, constraints, collation = _definition(definition)
            opts = choices.get(name)
            ui = {'control': controls.get(name) or ('number' if storage == 'number' else 'select' if opts else 'text')}
            if opts:
                ui['options'] = tuple(opts)
            if steps.get(name):
                ui['step'] = steps[name]
            if implementation and storage == 'date':
                raise ValueError(f'@chadc00per/typeset: "{name}" can\'t use date storage; store an ISO string (storage \'string\') instead')
            answered = aliases if implementation else every_alias
            label = labels.get(name) or name
            info = _frozen({
                'name': name, 'label': label, 'noun': nouns.get(name) or noun_from_label(label),
                'description': description, 'example': example,
                'aliases': tuple(a for a in answered if answered[a] == name), 'storage': storage, 'wire': storage,
                'collation': collation, 'constraints': constraints, 'ui': ui,
            })
            self._metadata[name] = info
            if implementation:
                if implementation not in modules:
                    raise ValueError(f'@chadc00per/typeset: "{name}" names unknown implementation "{implementation}"')
                module = modules[implementation]
                # Only this package's own types need its optional dependencies.
                own = isinstance(module, _LazyModule) and module._name == name and name in _EXTRAS
                self._types[name] = inherit(definition) or _constructor(
                    info, _resolve(module), details, class_names.get(name) or export_name(name),
                    (json_schemas or {}).get(name), own)
        self.names = tuple(self._types)
        self.all = tuple(self._metadata)
        self.aliases = dict(aliases)
        self._describe_aliases = every_alias
        self._json_schemas = json_schemas or {}

    def get(self, name):
        """A semantic type's class by name or alias; None when there is none."""
        return self._types.get(self.aliases.get(name, name))

    def describe(self, name=None):
        """Every type's metadata in picker order, or one type's (None when unknown)."""
        def plain(info):
            out = _thaw(info)
            Type = self._types.get(info['name'])
            if Type is not None and 'details' in Type.__dict__:
                out['ui'].update(Type.details())
            return out
        if name is None:
            return [plain(self._metadata[n]) for n in self.all]
        info = self._metadata.get(self._describe_aliases.get(name, name))
        return plain(info) if info is not None else None

    def to_json_schema(self, name):
        """A JSON Schema (draft 2020-12) for a type's canonical stored value; None for an unknown name.
        A type or a struct() answers its own."""
        if not isinstance(name, str):
            own = getattr(name, 'to_json_schema', None)
            return own() if callable(own) else None
        info = self._metadata.get(self._describe_aliases.get(name, name))
        return _json_schema(_thaw(info), self._json_schemas.get(info['name'], {})) if info is not None else None


# The JSON Schema a storage implies, before a type's own details.
_STORAGE_SCHEMAS = {
    'string': {'type': 'string'}, 'number': {'type': 'number'}, 'boolean': {'type': 'boolean'},
    'bigint': {'type': 'string', 'pattern': '^-?[0-9]+$'}, 'date': {'type': 'string', 'format': 'date-time'},
    'array': {'type': 'array'}, 'object': {'type': 'object'}, 'any': {},
}


def _json_schema(info, details):
    """A type's schema: its storage's, a select's choices, then the type's own details
    (a None detail removes a key), titled and described from the catalog."""
    schema = {'title': info['label'], 'description': info['description'], **_STORAGE_SCHEMAS[info['storage']]}
    if info['storage'] == 'number' and info['ui'].get('step') == 1:
        schema['type'] = 'integer'
    if 'options' in info['ui']:
        schema['enum'] = list(info['ui']['options'])
    for key, value in details.items():
        if value is None:
            schema.pop(key, None)
        else:
            schema[key] = copy.deepcopy(value)
    schema['x-typeset'] = info['name']
    return schema


def _definition(d):
    name, description, example, *rest = d
    implementation = rest[0] if len(rest) > 0 else None
    storage = rest[1] if len(rest) > 1 and rest[1] is not None else 'string'
    constraints = rest[2] if len(rest) > 2 and rest[2] is not None else 'length'
    collation = rest[3] if len(rest) > 3 and rest[3] is not None else ('lexical' if storage == 'string' else 'none')
    return name, description, example, implementation, storage, constraints, collation


def _resolve(module):
    return module() if callable(module) else module


# ---------------------------------------------------------------------------
# The package's own definitions, read from data/catalog.json


def _own():
    catalog = _data.load('catalog.json')
    semantic = set(catalog['constructors'])
    # A type whose inputs differ by language (function) describes itself as Python reads it.
    python = {name: runtimes.get('python', {}) for name, runtimes in catalog['runtimeSpecific'].items()}
    definitions, labels, nouns, controls, steps, options = [], {}, {}, {}, {}, {}
    for t in catalog['types']:
        name = t['name']
        t = {**t, **python.get(name, {})}
        definitions.append((name, t['description'], t['example'], name if name in semantic else None,
                            t['storage'], t['constraints'], t['collation']))
        if t['label'] != name:
            labels[name] = t['label']
        nouns[name] = t['noun']
        controls[name] = t['ui']['control']
        if 'step' in t['ui']:
            steps[name] = t['ui']['step']
        if 'options' in t['ui']:
            options[name] = t['ui']['options']
    modules = {name: _LazyModule(name) for name in semantic}
    return {
        'definitions': definitions, 'aliases': catalog['aliases'], 'modules': modules, 'labels': labels, 'nouns': nouns,
        'controls': controls, 'steps': steps, 'options': options, 'class_names': catalog['constructors'],
        'json_schemas': catalog['jsonSchemas'],
    }


class _LazyModule(Mapping):
    """A type's implementation module (_types/<name>.py) in the shape
    extend() modules take, imported on first use so ``import chadc00per_typeset`` stays
    cheap (phonenumbers loads only on the first phone number)."""

    def __init__(self, name):
        self._name = name
        self._shape = None

    def _load(self):
        if self._shape is None:
            module = importlib.import_module(f'._types.{self._name}', __package__)
            shape = {
                'types': [self._name],
                'normalize': lambda type, value, path, *rest: module.normalize(value, path, type, *rest),
            }
            if hasattr(module, 'validate'):
                shape['validate'] = lambda type, value, path: module.validate(value, path, type)
            if getattr(module, 'methods', None):
                shape['methods'] = {self._name: module.methods}
            if getattr(module, 'WIRED', False):
                shape['wired'] = True
            self._shape = shape
        return self._shape

    def __getitem__(self, key):
        if key == 'normalize':  # defer the import until a value is normalized
            return lambda type, value, path, *rest: self._load()['normalize'](type, value, path, *rest)
        if key in ('validate', 'wired'):
            shape = self._load()
            if key not in shape:
                raise KeyError(key)
            return shape[key]
        return self._load()[key]

    def get(self, key, default=None):
        try:
            return self[key]
        except KeyError:
            return default

    def __iter__(self):
        return iter(self._load())

    def __len__(self):
        return len(self._load())


OWN = _own()
types = Catalog(**OWN)


def extend(*, definitions, modules=None, describe_aliases=None, details=(), labels=None, nouns=None, controls=None):
    """A consumer's own catalog: these types plus its own. ``definitions`` is the
    full picker order: a name takes this package's definition (and its class,
    unless a table below changes it); a tuple defines a new type whose
    implementation is one of ``modules`` (None: a core type, only described).
    A module is a dict: {'normalize': fn(type, value, path), 'validate'?: fn,
    where ``type`` is the type's noun, for messages ("must be a valid {type}");
    'methods'?: {type: {name: fn}}, 'details'?: fn(type) -> dict}."""
    more = modules or {}
    labels = labels or {}
    nouns = nouns or {}
    controls = controls or {}
    details = tuple(details)
    by_name = {d[0]: d for d in OWN['definitions']}

    def changed(name):
        return name in labels or name in nouns or name in controls or name in details

    order = []
    for d in definitions:
        if isinstance(d, str):
            if d not in by_name:
                raise ValueError(f'@chadc00per/typeset: unknown type "{d}"')
            order.append(by_name[d])
        else:
            order.append(tuple(d))

    def inherit(d):
        if by_name.get(d[0]) == d and _definition(d)[3] not in more and not changed(d[0]):
            return types.get(d[0])
        return None

    return Catalog(**{
        **OWN,
        'definitions': order,
        'modules': {**OWN['modules'], **more},
        'describe_aliases': describe_aliases or {},
        'details': details,
        'labels': {**OWN['labels'], **labels},
        # A relabeled built-in keeps its noun unless ``nouns`` gives one; a new type's comes from its label.
        'nouns': {**OWN['nouns'], **nouns},
        'controls': {**OWN['controls'], **controls},
        'inherit': inherit,
    })


def noun_from_label(label: str) -> str:
    """A label as a noun (js/src/labels.js nounFromLabel): words lowercased except acronyms
    and words with inner capitals, with a "(...)" or "[...]" note dropped."""
    def word(m):
        w = m.group(0)
        return w if w == w.upper() or re.search('[A-Z].*[A-Z]', w) else w.lower()
    return re.sub('[A-Za-z][A-Za-z0-9]*', word, re.sub(r'\s*[(\[].*\Z', '', label, flags=re.S))


def type_of(value) -> str:
    """JS typeof, except an instance of a semantic type answers its name:
    type_of(Email('ada@example.com')) → 'email'."""
    if isinstance(value, Value):
        return value._typeset_name
    return js.typeof(value)


def export_name(name: str) -> str:
    """A type's class name: Email, MimeType, XY."""
    return _data.load('catalog.json')['constructors'].get(name) or name[0].upper() + name[1:]
