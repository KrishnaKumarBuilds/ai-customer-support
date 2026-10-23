import { User, IUser } from '../models/User';
import { Ticket } from '../models/Ticket';

export class RoutingService {
  /**
   * Find the most suitable agent based on specialization, availability, and active workload
   */
  public static async findBestAgent(
    category: string,
    suggestedSkill: string,
    priority: string
  ): Promise<IUser | null> {
    // 1. Fetch all agents
    const agents = await User.find({ role: 'AGENT' });
    if (!agents || agents.length === 0) {
      console.warn('[ROUTING SERVICE] No agents found in the system.');
      return null;
    }

    // 2. Compute live active workloads for all agents
    const activeStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_AGENT', 'REOPENED'];
    const workloads = await Ticket.aggregate([
      { $match: { assignedAgent: { $in: agents.map((a) => a._id) }, status: { $in: activeStatuses } } },
      { $group: { _id: '$assignedAgent', count: { $sum: 1 } } }
    ]);

    const workloadMap = new Map<string, number>();
    workloads.forEach((item) => {
      workloadMap.set(item._id.toString(), item.count);
    });

    // 3. Filter candidates
    // Group A: Available agents with matching skill/category
    const skillMatches = agents.filter((agent) => {
      const skillsLower = agent.skills.map((s) => s.toLowerCase());
      const catLower = category.toLowerCase();
      const sugLower = suggestedSkill.toLowerCase();
      return (
        agent.availability === 'AVAILABLE' &&
        (skillsLower.some((s) => s.includes(catLower) || catLower.includes(s)) ||
          skillsLower.some((s) => s.includes(sugLower) || sugLower.includes(s)))
      );
    });

    if (skillMatches.length > 0) {
      // Pick specialist with lowest workload
      skillMatches.sort((a, b) => {
        const loadA = workloadMap.get(a._id.toString()) || 0;
        const loadB = workloadMap.get(b._id.toString()) || 0;
        return loadA - loadB;
      });
      const selected = skillMatches[0];
      console.log(`[ROUTING SERVICE] Routed to specialist agent ${selected.name} (${selected.email}) with load ${workloadMap.get(selected._id.toString()) || 0}`);
      return selected;
    }

    // Group B: Any available agent
    const availableAgents = agents.filter((a) => a.availability === 'AVAILABLE');
    if (availableAgents.length > 0) {
      availableAgents.sort((a, b) => {
        const loadA = workloadMap.get(a._id.toString()) || 0;
        const loadB = workloadMap.get(b._id.toString()) || 0;
        return loadA - loadB;
      });
      const selected = availableAgents[0];
      console.log(`[ROUTING SERVICE] Routed to available general agent ${selected.name} with load ${workloadMap.get(selected._id.toString()) || 0}`);
      return selected;
    }

    // Group C: Fallback to agent with lowest workload regardless of status
    agents.sort((a, b) => {
      const loadA = workloadMap.get(a._id.toString()) || 0;
      const loadB = workloadMap.get(b._id.toString()) || 0;
      return loadA - loadB;
    });

    const selected = agents[0];
    console.log(`[ROUTING SERVICE] Fallback routed to agent ${selected.name}`);
    return selected;
  }
}
