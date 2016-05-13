# Interpreter.ts
Our implementation features the 'interpretCommand' as described. It also has a bunch of helper functions, the most important being 'getValidObjects' which returns all objects in the parsed command that exist in the world. We then compile the objects into literals, check that the literal is physically possible and return it.

