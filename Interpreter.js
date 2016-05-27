///<reference path="World.ts"/>
///<reference path="Parser.ts"/>
/**
 * Interpreter module
 *
 * The goal of the Interpreter module is to interpret a sentence
 * written by the user in the context of the current world state. In
 * particular, it must figure out which objects in the world,
 * i.e. which elements in the `objects` field of WorldState, correspond
 * to the ones referred to in the sentence.
 *
 * Moreover, it has to derive what the intended goal state is and
 * return it as a logical formula described in terms of literals, where
 * each literal represents a relation among objects that should
 * hold. For example, assuming a world state where "a" is a ball and
 * "b" is a table, the command "put the ball on the table" can be
 * interpreted as the literal ontop(a,b). More complex goals can be
 * written using conjunctions and disjunctions of these literals.
 *
 * In general, the module can take a list of possible parses and return
 * a list of possible interpretations, but the code to handle this has
 * already been written for you. The only part you need to implement is
 * the core interpretation function, namely `interpretCommand`, which produces a
 * single interpretation for a single command.
 */
var Interpreter;
(function (Interpreter) {
    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types
    /**
      Top-level function for the Interpreter. It calls `interpretCommand` for each possible parse of the command. No need to change this one.
     * @param parses List of parses produced by the Parser.
     * @param currentState The current state of the world.
     * @returns Augments ParseResult with a list of interpretations. Each interpretation is represented by a list of Literals.
     */
    function interpret(parses, currentState) {
        var errors = [];
        var interpretations = [];
        parses.forEach(function (parseresult) {
            try {
                var result = parseresult;
                result.interpretation = interpretCommand(result.parse, currentState);
                interpretations.push(result);
            }
            catch (err) {
                errors.push(err);
            }
        });
        if (interpretations.length) {
            return interpretations;
        }
        else {
            // only throw the first error found
            throw errors[0];
        }
    }
    Interpreter.interpret = interpret;
    function stringify(result) {
        return result.interpretation.map(function (literals) {
            return literals.map(function (lit) { return stringifyLiteral(lit); }).join(" & ");
            // return literals.map(stringifyLiteral).join(" & ");
        }).join(" | ");
    }
    Interpreter.stringify = stringify;
    function stringifyLiteral(lit) {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }
    Interpreter.stringifyLiteral = stringifyLiteral;
    //////////////////////////////////////////////////////////////////////
    // private functions
    /**
     * The core interpretation function.
     * @param cmd The actual command. Note that it is *not* a string, but rather an object of type `Command` (as it has been parsed by the parser).
     * @param state The current state of the world. Useful to look up objects in the world.
     * @returns A list of list of Literal, representing a formula in disjunctive normal form (disjunction of conjunctions). See the dummy interpetation returned in the code for an example, which means ontop(a,floor) AND holding(b).
     */
    function interpretCommand(cmd, state) {
        //var objects : string[] = Array.prototype.concat.apply([], state.stacks);
        //var a : string = objects[Math.floor(Math.random() * objects.length)];
        //var b : string = objects[Math.floor(Math.random() * objects.length)];
        var interpretation = [];
        var ids_a = getValidObjects(cmd.entity);
        switch (cmd.command) {
            case "take":
                ids_a.forEach(function (id_a) {
                    if (id_a != "floor")
                        interpretation.push([
                            { polarity: true, relation: "holding", args: [id_a] }
                        ]);
                });
                break;
            //case "put":
            case "move":
                var ids_b = getValidObjects(cmd.location.entity);
                ids_a.forEach(function (id_a) {
                    ids_b.forEach(function (id_b) {
                        var lit = {
                            polarity: true,
                            relation: cmd.location.relation,
                            args: [id_a, id_b]
                        };
                        if (obeyesPhysicalLaws(lit)) {
                            interpretation.push([lit]);
                        }
                    });
                });
                break;
        }
        if (interpretation.length) {
            return interpretation;
        }
        else {
            throw new Error();
        }
        /**
         * Checks if the physical laws are obeyed by a literal
         * @param literal the literal to check
         */
        function obeyesPhysicalLaws(literal) {
            if (literal.args[1] == "floor" && literal.relation == "ontop") {
                return true;
            }
            var a = state.objects[literal.args[0]];
            var b = state.objects[literal.args[1]];
            // An object cannot have a relation with itself
            if (a == b || a.form == "floor") {
                return false;
            }
            if ((literal.relation == "inside" && b.form == "box")
                || (literal.relation == "ontop" && b.form != "box")) {
                // Small objects cannot support large objects
                var cond1 = a.size == "large" && b.size == "small";
                // Balls cannot support anything
                var cond2 = b.form == "ball";
                // balls can not reside on table
                var cond3 = a.form == "ball" && b.form == "table";
                // boxes can't contain pyriamids, planks, boxes of the same size
                var cond4 = b.form == "box" && b.size == a.size && (a.form == "pyramid" ||
                    a.form == "plank" ||
                    a.form == "box");
                // small boxes can not be supported by small bricks or pyramids
                var cond5 = a.form == "box" && a.size == "small" && (b.form == "pyramid" ||
                    (b.form == "brick" && b.size == "small"));
                // large boxes cant be supported by large pyramids
                var cond6 = a.form == "box" && a.size == "large" && (b.form == "pyramid" && b.size == "large");
                if (cond1 || cond2 || cond3 ||
                    cond4 || cond5 || cond6) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Checks if a given object is in the state
         * @param object an object in key form
         */
        function isInStack(object) {
            // All objects in stacks
            var objects = Array.prototype.concat.apply([], state.stacks);
            return objects.indexOf(object) > -1;
        }
        /**
        * Returns the stack that a given object is in.
        * @param object an object in key form
        */
        function getStack(object) {
            var stacks = state.stacks;
            for (var i = 0; i < stacks.length; i++) {
                if (stacks[i].indexOf(object) > -1) {
                    return i;
                }
            }
            return null;
        }
        /**
         * Returns all the keys of the objects that matches the given description
         * @param object an object in parsed form
         */
        function findObjectIds(object) {
            var ids = [];
            if (object.form == "floor") {
                ids.push("floor");
                return ids;
            }
            for (var key in state.objects) {
                var colorCheck = !object.color ? true : object.color == state.objects[key].color;
                var formCheck = !object.form || object.form == "anyform" ?
                    true : object.form == state.objects[key].form;
                var sizeCheck = !object.size ? true : object.size == state.objects[key].size;
                if (colorCheck && formCheck && sizeCheck) {
                    ids.push(key);
                }
            }
            return ids;
        }
        /**
         * Returns a set of valid objects given an entity
         * @param entity The entity to be checked.
         */
        function getValidObjects(entity) {
            //If the entity has a location object is complex
            if (entity.object.location) {
                var objIds = findObjectIds(entity.object.object);
                return pruneObjectsByLocation(entity.object.location, objIds);
            }
            else {
                var objsInStack = [];
                findObjectIds(entity.object).forEach(function (o) {
                    if (isInStack(o) || o == "floor") {
                        objsInStack.push(o);
                    }
                });
                return objsInStack;
            }
        }
        /**
         * Removes all objects that do not fulfill the location requirements
         * @param location The specified location to be checked
         * @param parents Reference to the parent objects that serves to a reference to check the location.
         */
        function pruneObjectsByLocation(location, parents) {
            var legalObjs = [];
            var children = getValidObjects(location.entity);
            children.forEach(function (c) {
                parents.forEach(function (p) {
                    if (hasRelation(location.relation, p, c)) {
                        legalObjs.push(p);
                    }
                });
            });
            return legalObjs;
        }
        /**
         * Checks the if a relation between two object is true or not. E.g. "The blue ball is beside the table." will return true if the ball is beside the table, otherwise false.
         * @param relation The relation to be checked. E.g. "beside", "leftof", "inside"
         * @param parent The first object in e.g inside(x,y)
         * @param child The second object in e.g inside(x,y)
         */
        function hasRelation(relation, parent, child) {
            switch (relation) {
                case "beside":
                    if (getStack(parent) - 1 == getStack(child) ||
                        getStack(parent) == getStack(child) - 1) {
                        return true;
                    }
                    break;
                case "leftof":
                    if (getStack(parent) == getStack(child) - 1) {
                        return true;
                    }
                    break;
                case "rightof":
                    if (getStack(parent) == getStack(child) + 1) {
                        return true;
                    }
                    break;
                case "above":
                    var i = getStack(parent);
                    if (state.stacks[i].indexOf(parent) > state.stacks[i].indexOf(child)) {
                        return true;
                    }
                    break;
                case "below":
                    var i = getStack(parent);
                    if (state.stacks[i].indexOf(parent) < state.stacks[i].indexOf(child)) {
                        return true;
                    }
                    break;
                case "ontop":
                case "inside":
                    var i = getStack(parent);
                    if (state.stacks[i].indexOf(parent) == state.stacks[i].indexOf(child) + 1 &&
                        (state.stacks[i].indexOf(child) != -1 || child == "floor")) {
                        return true;
                    }
                    break;
            }
            return false;
        }
    }
})(Interpreter || (Interpreter = {}));
