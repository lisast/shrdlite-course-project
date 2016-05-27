///<reference path="World.ts"/>
///<reference path="Interpreter.ts"/>
///<reference path="StateGraph.ts"/>

/**
* Planner module
*
* The goal of the Planner module is to take the interpetation(s)
* produced by the Interpreter module and to plan a sequence of actions
* for the robot to put the world into a state compatible with the
* user's command, i.e. to achieve what the user wanted.
*
* The planner should use your A* search implementation to find a plan.
*/
module Planner {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

    /**
     * Top-level driver for the Planner. Calls `planInterpretation` for each given interpretation generated by the Interpreter.
     * @param interpretations List of possible interpretations.
     * @param currentState The current state of the world.
     * @returns Augments Interpreter.InterpretationResult with a plan represented by a list of strings.
     */
    export function plan(interpretations : Interpreter.InterpretationResult[], currentState : WorldState) : PlannerResult[] {
        var errors : Error[] = [];
        var plans : PlannerResult[] = [];
        interpretations.forEach((interpretation) => {
            try {
                var result : PlannerResult = <PlannerResult>interpretation;
                result.plan = planInterpretation(result.interpretation, currentState);
                if (result.plan.length == 0) {
                    result.plan.push("That is already true!");
                }
                plans.push(result);
            } catch(err) {
                errors.push(err);
            }
        });
        if (plans.length) {
            return plans;
        } else {
            // only throw the first error found
            throw errors[0];
        }
    }

    export interface PlannerResult extends Interpreter.InterpretationResult {
        plan : string[];
    }

    export function stringify(result : PlannerResult) : string {
        return result.plan.join(", ");
    }

    //////////////////////////////////////////////////////////////////////
    // private functions

    /**
     * The core planner function. The code here is just a template;
     * you should rewrite this function entirely. In this template,
     * the code produces a dummy plan which is not connected to the
     * argument `interpretation`, but your version of the function
     * should be such that the resulting plan depends on
     * `interpretation`.
     *
     *
     * @param interpretation The logical interpretation of the user's desired goal. The plan needs to be such that by executing it, the world is put into a state that satisfies this goal.
     * @param state The current world state.
     * @returns Basically, a plan is a
     * stack of strings, which are either system utterances that
     * explain what the robot is doing (e.g. "Moving left") or actual
     * actions for the robot to perform, encoded as "l", "r", "p", or
     * "d". The code shows how to build a plan. Each step of the plan can
     * be added using the `push` method.
     */
    function planInterpretation(interpretation : Interpreter.DNFFormula, state : WorldState) : string[] {
        // This function returns a dummy plan involving a random stack
        var graph : StateGraph = new StateGraph(state.objects)
        var startNode : StateNode = new StateNode(state)
        var h = (n: StateNode) => 0;

        var isGoal = (n:StateNode) => true
        // TODO - construct goal function from DNFFormula : (n:Node) => boolean

        var path = aStarSearch(graph, startNode, isGoal, h, 10).path
        var arm : number = state.arm
        var plan : string[] = [];

        for (var i = 0; i < path.length-1; i++) {
            plan = plan.concat(planBetweenStates(path[i], path[i+1]))
        }

        return plan;

        function planBetweenStates(s1 : StateNode, s2 : StateNode) : string[] {
            var from = s1.data
            var to = s2.data
            var picStack = 0
            var putStack = 0
			
			//Get the stacks an object will move from and to
            for (var i = 0; i < from.length; i++) {
                if (from[i].length > to[i].length) {
                    picStack = i
                }
                else if (from[i].length < to[i].length) {
                    putStack = i
                }
            }
            //Move the arm to the stack the object will move from
            var armPosition : number = state.arm
            var moveDir = armPosition < picStack ? "r" : "l"
            for (var i = 0; i < Math.abs(armPosition - picStack); i++) {
                plan.push(moveDir)
            }
        
            //Move the object to the stack it will get to
            var obj = from[i].pop()
            plan.push("Picking up the " + state.objects[obj].form, "p");
            moveDir = picStack < putStack ? "r" : "l"
            plan.push("Moving arm " + moveDir == "r" ? "right" : "left")
            for (var i = 0; i < Math.abs(picStack - putStack); i++) {
                plan.push(moveDir)
            }
            plan.push("Dropping the " + state.objects[obj].form, "d")

            return plan
        }
    }
}
