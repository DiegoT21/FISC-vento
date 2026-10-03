import { ENDPOINTS } from "./endpoints";
import { listarTodos } from "./listarTodos";

export const listarLogsAuditoria = () => listarTodos(ENDPOINTS.AUDITORIA);
