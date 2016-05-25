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

    clone() {
        var tmp = new StateNode(null)
        tmp.data = []
        for (var i = 0; i < this.data.length; i++) {
            tmp.data[i] = this.data[i].slice(0)
        }
        return tmp
    }
}


class StateGraph implements Graph<StateNode> {

    outgoingEdges(node : StateNode) : Edge<StateNode>[] {
        var edges : Edge<StateNode>[] = []
        for (var i = 0; i < node.data.length; i++) {
            for (var j = 0; j < node.data.length; j++) {
                if (i==j) { continue }
                var next = node.clone()
                next.data[j].push(next.data[i].pop())
                if (isValidState(next)) {
                    edges.push({
                        from: node,
                        to: next,
                        cost: 1
                    })
                }
            }
        }
        return edges
    }

    compareNodes(a : StateNode, b : StateNode) {
        return a.compareTo(b)
    }
}

function isValidState(state : StateNode) : boolean {
    // TODO - this should check that physical laws are obeyed
    return true
}
