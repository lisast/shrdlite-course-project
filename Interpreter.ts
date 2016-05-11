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
module Interpreter {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

/**
Top-level function for the Interpreter. It calls `interpretCommand` for each possible parse of the command. No need to change this one.
* @param parses List of parses produced by the Parser.
* @param currentState The current state of the world.
* @returns Augments ParseResult with a list of interpretations. Each interpretation is represented by a list of Literals.
*/
    export function interpret(parses : Parser.ParseResult[], currentState : WorldState) : InterpretationResult[] {
        var errors : Error[] = [];
        var interpretations : InterpretationResult[] = [];
        parses.forEach((parseresult) => {
            try {
                var result : InterpretationResult = <InterpretationResult>parseresult;
                result.interpretation = interpretCommand(result.parse, currentState);
                interpretations.push(result);
            } catch(err) {
                errors.push(err);
            }
        });
        if (interpretations.length) {
            return interpretations;
        } else {
            // only throw the first error found
            throw errors[0];
        }
    }

    export interface InterpretationResult extends Parser.ParseResult {
        interpretation : DNFFormula;
    }

    export type DNFFormula = Conjunction[];
    type Conjunction = Literal[];

    /**
    * A Literal represents a relation that is intended to
    * hold among some objects.
    */
    export interface Literal {
	/** Whether this literal asserts the relation should hold
	 * (true polarity) or not (false polarity). For example, we
	 * can specify that "a" should *not* be on top of "b" by the
	 * literal {polarity: false, relation: "ontop", args:
	 * ["a","b"]}.
	 */
        polarity : boolean;
	/** The name of the relation in question. */
        relation : string;
	/** The arguments to the relation. Usually these will be either objects
     * or special strings such as "floor" or "floor-N" (where N is a column) */
        args : string[];
    }

    export function stringify(result : InterpretationResult) : string {
        return result.interpretation.map((literals) => {
            return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
            // return literals.map(stringifyLiteral).join(" & ");
        }).join(" | ");
    }

    export function stringifyLiteral(lit : Literal) : string {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }

    //////////////////////////////////////////////////////////////////////
    // private functions
    /**
     * The core interpretation function. The code here is just a
     * template; you should rewrite this function entirely. In this
     * template, the code produces a dummy interpretation which is not
     * connected to `cmd`, but your version of the function should
     * analyse cmd in order to figure out what interpretation to
     * return.
     * @param cmd The actual command. Note that it is *not* a string, but rather an object of type `Command` (as it has been parsed by the parser).
     * @param state The current state of the world. Useful to look up objects in the world.
     * @returns A list of list of Literal, representing a formula in disjunctive normal form (disjunction of conjunctions). See the dummy interpetation returned in the code for an example, which means ontop(a,floor) AND holding(b).
     */
    function interpretCommand(cmd : Parser.Command, state : WorldState) : DNFFormula {
        // This returns a dummy interpretation involving two random objects in the world
        var objects : string[] = Array.prototype.concat.apply([], state.stacks);
        var a : string = objects[Math.floor(Math.random() * objects.length)];
        var b : string = objects[Math.floor(Math.random() * objects.length)];
        var interpretation : DNFFormula = [];
        if (cmd.command == "take") {
            var ids = findObjectId(cmd.entity.object)
            ids.forEach((id : string) => {
                if (isInStack(id)) {
                    interpretation.push([
                        {polarity: true, relation: "holding", args: [id]}
                    ])
                }
            })
        } else {
            console.log(cmd)
            var ids = findObjectId(cmd.entity.object)
            ids.forEach((id : string) => {
                if (isInStack(id)) {
                    interpretation.push([
                        {polarity: true, relation: cmd.location.relation, args: [id]}
                    ])
                }
            })
            //interpretation = [[
                //{polarity: true, relation: "ontop", args: [a, "floor"]},
                //{polarity: true, relation: "holding", args: [b]}
            //]];
        }
        return interpretation;

        /**
         * This function checks if the physical laws are not violated by a literal
         */
        function isValidLiteral(literal : Literal) : Boolean {
            if (literal.relation == "holding" || literal.relation == "leftof") {
                return true
            }
            var a = literal.args[0]
            var b = literal.args[1]
            if (literal.relation == "inside" || literal.relation == "ontop") {
                // Small objects cannot support large objects
                if (state.objects[a].size == "large" && state.objects[b].size == "small") {
                    return false
                }
                // Balls cannot support anything
                else if (state.objects[b].form == "ball") {
                    return false;
                }
            }
            return true
        }

        /**
        * Checks if a given object is in the state
        */
        function isInStack(object : string) : Boolean {
            // All objects in stacks
            var objects : string[] = Array.prototype.concat.apply([], state.stacks);
            return objects.indexOf(object) > -1;
        }

        /**
        * Resturns a key to a (first) object that matches the given object.
        */
        function findObjectId(object : Parser.Object) : string[] {
            // All objects in the world
            var ids : string[] = []
            for(var key in state.objects) {
                var colorCheck = !object.color ? true : object.color == state.objects[key].color
                var formCheck = !object.form  || object.form == "anyform" ?
                    true : object.form == state.objects[key].form
                var sizeCheck = !object.size ? true : object.size == state.objects[key].size

                if (colorCheck && formCheck && sizeCheck) {
                    ids.push(key)
                }
            }
            return ids
        }
    }
}

