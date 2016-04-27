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
    var visitedNodes = new collections.Set<Node>();
    var pendingNodes = new collections.Set<Node>();
    var cameFrom: {[key:Node]: Node} = {};

    var cost: {[key:Node]: number} = {};
    cost[start] = 0;

    var fScore: {[key:Node]: number} = {};
    fScore[start] = heuristics(start);

    while(!pendingNodes.empty()) {
        var currentNode = pendingNodes[0]; //If pendingNodes is a priority queue
        if(goal(currentNode)) {
            var result: SearchResult<Node> = {
                path: constructPath(cameFrom, currentNode),
                cost = fScore[currentNode]
            }
            return result;
        }
        pendingNodes.remove(currentNode);
        visitedNodes.add(currentNode);

        for(var neighbour in getNeighbours(graph, currentNode)) {
            if(neighbour in visitedNodes) {
                continue;
            }
            tentativeCost = cost[currentNode] + distance(currentNode, neighbour);
            if(!pendingNodes.contains(currentNode)) {
                pendingNodes.add(currentNode);
            } else if (tentativeCost >= cost[neighbour]) {
                continue;
            }

            cameFrom[neighbour] = currentNode;
            cost[neighbour] = tentativeCost;
            fScore[neighbour] = tentativeCost + heuristics(neighbour);
        }
        // TODO: Check timeout
    }
    return null; //What should we return?
}

function constructPath(
    cameFrom : {[key:Node]: Node},
    endNode: Node
) : Node[] {
    var currentNode = endNode;
    var path = [endNode];
    while(cameFrom[currentNode]!=null) {
        currentNode = cameFrom[currentNode];
        path.push(currentNode);
    }
    return path;
}

