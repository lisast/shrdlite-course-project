///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>

/** Graph module
*
*  Types for generic A\* implementation.
*
*  *NB.* The only part of this module
*  that you should change is the `aStarSearch` function. Everything
*  else should be used as-is.
*/

/** An edge in a graph. */
class Edge<Node> {
    from : Node;
    to   : Node;
    cost : number;
}

/** A directed graph. */
interface Graph<Node> {
    /** Computes the edges that leave from a node. */
    outgoingEdges(node : Node) : Edge<Node>[];
    /** A function that compares nodes. */
    compareNodes : collections.ICompareFunction<Node>;
}

/** Type that reports the result of a search. */
class SearchResult<Node> {
    /** The path (sequence of Nodes) found by the search algorithm. */
    path : Node[];
    /** The total cost of the path. */
    cost : number;
}

/**
* A\* search implementation, parameterised by a `Node` type. The code
* here is just a template; you should rewrite this function
* entirely. In this template, the code produces a dummy search result
* which just picks the first possible neighbour.
*
* Note that you should not change the API (type) of this function,
* only its body.
* @param graph The graph on which to perform A\* search.
* @param start The initial node.
* @param goal A function that returns true when given a goal node. Used to determine if the algorithm has reached the goal.
* @param heuristics The heuristic function. Used to estimate the cost of reaching the goal from a given Node.
* @param timeout Maximum time (in seconds) to spend performing A\* search.
* @returns A search result, which contains the path from `start` to a node satisfying `goal` and the cost of this path.
*/
function aStarSearch<Node> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    heuristics : (n:Node) => number,
    timeout : number
) : SearchResult<Node> {
    timeout = timeout * 1000;
    var startTime = new Date().getTime();
    var cost = new collections.Dictionary<Node, number>();
    cost.setValue(start, 0);

    var fScore = new collections.Dictionary<Node, number>();
    fScore.setValue(start, heuristics(start));

    var visitedNodes = new collections.Set<Node>();
    var pendingNodes = new collections.PriorityQueue<Node>((a: Node, b: Node) =>
                                                   {
                                                       return cost.getValue(a) - cost.getValue(b);
                                                   }
                                                  );
    pendingNodes.enqueue(start);
    var cameFrom = new collections.Dictionary<Node, Node>();

    while(!pendingNodes.isEmpty()) {
        // Check timeout
        if(new Date().getTime() - startTime > timeout) {
            break;
        }
        var currentNode = pendingNodes.dequeue();
        if(goal(currentNode)) {
            var result: SearchResult<Node> = {
                path: constructPath(currentNode),
                cost: fScore.getValue(currentNode)
            }
            return result;
        }
        visitedNodes.add(currentNode);

        for(var neighbour of getNeighbours(currentNode)) {
            if (visitedNodes.contains(neighbour)) {
                continue;
            }
            var tentativeCost = cost.getValue(currentNode) + distance(currentNode, neighbour);
            if(!pendingNodes.contains(neighbour)) {
                pendingNodes.add(neighbour);
            } else if (tentativeCost >= cost.getValue(neighbour)) {
                continue;
            }

            cameFrom.setValue(neighbour, currentNode);
            cost.setValue(neighbour, tentativeCost);
            fScore.setValue(neighbour, tentativeCost + heuristics(neighbour));
        }
    }
    return undefined; //TODO: What should we return?

    function getNeighbours(home: Node) : Node[] {
        var neighbours : Node[] = [];
        for (var edge of graph.outgoingEdges(home)) {
            neighbours.push(edge.to)
        }
        return neighbours;
    }

    function distance(node: Node, next: Node) : number {
        for (var edge of graph.outgoingEdges(node)) {
            if (graph.compareNodes(next, edge.to) == 0)
                return edge.cost;
        }
        return;
    }

    function constructPath(endNode: Node) : Node[] {
        var currentNode = endNode;
        var path = [endNode];
        while(cameFrom.getValue(currentNode)!=undefined) {
            currentNode = cameFrom.getValue(currentNode);
            path.push(currentNode);
        }
        return path;
    }
}
