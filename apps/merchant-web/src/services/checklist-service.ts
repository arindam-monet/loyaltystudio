
// Define the checklist status type
export type ChecklistStatus = {
  merchant: boolean;
  program: boolean;
  members: boolean;
  test: boolean;
  integration: boolean;
  team: boolean;
};

/**
 * Service to handle checklist status operations
 */
export class ChecklistService {
  /**
   * Get the current checklist status
   */
  static async getStatus(): Promise<ChecklistStatus> {
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll use localStorage as a simulation
      const storedStatus = localStorage.getItem('checklistStatus');
      if (storedStatus) {
        return JSON.parse(storedStatus);
      }

      // Default status if nothing is stored
      return {
        merchant: false,
        program: false,
        members: false,
        test: false,
        integration: false,
        team: false,
      };
    } catch (error) {
      console.error('Failed to get checklist status:', error);
      throw error;
    }
  }

  /**
   * Update a specific checklist item status
   */
  static async updateStatus(item: keyof ChecklistStatus, completed: boolean): Promise<ChecklistStatus> {
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll use localStorage as a simulation
      const currentStatus = await this.getStatus();
      const updatedStatus = {
        ...currentStatus,
        [item]: completed,
      };

      localStorage.setItem('checklistStatus', JSON.stringify(updatedStatus));
      return updatedStatus;
    } catch (error) {
      console.error(`Failed to update ${item} status:`, error);
      throw error;
    }
  }

  /**
   * Mark the members step as completed
   */
  static async completeMembersStep(): Promise<ChecklistStatus> {
    return this.updateStatus('members', true);
  }

  /**
   * Mark the test step as completed
   */
  static async completeTestStep(): Promise<ChecklistStatus> {
    return this.updateStatus('test', true);
  }
}
