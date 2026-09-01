from .chains import CHAIN_META  # noqa: F401
from .exercises import EXERCISES as _BASE_EXERCISES
from .moves import MOVES as _MOVES
from .programs import PROGRAMS  # noqa: F401

# The full library = the original 7-equipment set + the extra bodyweight/bands moves.
EXERCISES = _BASE_EXERCISES + _MOVES
