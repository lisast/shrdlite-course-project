///<reference path="Graph.ts"/>
///<reference path="World.ts"/>

/* This is a graph representing all the
 * states in the shrdlite world.
 */

class StateNode {
    public data
    constructor(state : WorldState) {
        this.data = state.stacks
    }

    compareTo(other : StateNode) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].length != other.data[i].length) {
                return -1
            }
            for (var j = 0; i < this.data[i].length; j++) {
                if (this.data[i][j] != other.data[i][j]) {
                    return -1
                }
            }
        }
        return 0
    }
}


class StateGraph implements Graph<StateNode> {

    constructor(
        private startState : StateNode
    ) {
    }

    outgoingEdges(node : StateNode) {
        return null
    }

    compareNodes(a : StateNode, b : StateNode) {
        return a.compareTo(b)
    }

    getStartingNode() : StateNode {
        return this.startState
    }
}

function isValidState(state : StateNode) {
    // TODO - this should check that physical laws are obeyed
    return true
}
