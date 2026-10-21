import { Connect, dbTabla } from 'dbtabla';

export class mysqlTable extends Connect {
    connection: any;
    constructor(params: any, connect?: boolean);
    connect(): Promise<any>;
    end(): Promise<any>;
    query(query: string, params?: any[]): Promise<any>;
    beginTransaction(): Promise<any>;
    commit(): Promise<any>;
    rollback(): Promise<any>;
}

export default mysqlTable;
