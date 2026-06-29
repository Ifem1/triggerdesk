export interface ActionResult {
  success: boolean;
  description: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}
