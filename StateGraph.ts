///<reference path="Graph.ts"/>
///<reference path="World.ts"/>

/* This is a graph representing all the
 * states in the shrdlite world.
 */

class StateNode {
    public data : string[][]
    public holding : string
    constructor(stacks : string[][]) {
        this.data = stacks
    }

    addHolding(obj : string) {
        this.holding = obj
    }

    compareTo(other : StateNode) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].length != other.data[i].length) {
                return -1
            }
            for (var j = 0; j < this.data[i].length; j++) {
                if (this.data[i][j] != other.data[i][j]) {
                    return -1
                }
            }
        }
        return 0
    }

    clone() {
        var fakeStacks : string[][] = []
        var tmp = new StateNode(fakeStacks)
        for (var i = 0; i < this.data.length; i++) {
            tmp.data[i] = this.data[i].slice(0)
        }
        return tmp
    }

    toString() : string {
        var asdf = ""
        this.data.forEach((s : string[]) => {
            s.forEach((r) => {
                asdf = asdf + r
            })
            asdf = asdf + ","
        })
        return asdf
    }
}


class StateGraph implements Graph<StateNode> {

    constructor(
        private objects : { [s: string]: ObjectDefinition; }
    ) {
    }

    outgoingEdges(node : StateNode) : Edge<StateNode>[] {
        var edges : Edge<StateNode>[] = []
        if (node.holding) {
            for (var i = 0; i < node.data.length; i++) {
                var next = node.clone()
                next.data[i].push(node.holding)
                if (this.isValidStack(next.data[j])) {
                    edges.push({
                        from: node,
                        to: next,
                        cost: 1
                    })
                }
            }
        } else {
            for (var i = 0; i < node.data.length; i++) {
                for (var j = 0; j < node.data.length; j++) {
                    if (i==j || !node.data[i].length) { continue }
                    var next = node.clone()
                    next.data[j].push(next.data[i].pop())
                    if (this.isValidStack(next.data[j])) {
                        edges.push({
                            from: node,
                            to: next,
                            cost: 1
                        })
                    }
                }
            }
        }
        return edges
    }

    compareNodes(a : StateNode, b : StateNode) {
        return a.compareTo(b)
    }

    isValidStack(stack : string[]) : boolean {
        if (stack.length <= 1) {
            return true
        }
        var a = this.objects[stack[stack.length-1]]
        var b = this.objects[stack[stack.length-2]]

        // Small objects cannot support large objects
        var cond1 = a.size == "large" && b.size == "small"
        // Balls cannot support anything
        var cond2 = b.form == "ball"
        // balls can not reside on table
        var cond3 = a.form == "ball" && b.form == "table"
        // boxes can't contain pyriamids, planks, boxes of the same size
        var cond4 = b.form == "box" && b.size == a.size && (
            a.form == "pyramid" ||
            a.form == "plank" ||
            a.form == "box")
        // small boxes can not be supported by small bricks or pyramids
        var cond5 = a.form == "box" && a.size == "small" && (
            b.form == "pyramid" ||
            (b.form == "brick" && b.size == "small"))
        // large boxes cant be supported by large pyramids
        var cond6 = a.form == "box" && a.size == "large" && (
            b.form == "pyramid" && b.size == "large")

        return !(cond1 || cond2 || cond3 || cond4 || cond5 || cond6)
    }
}
