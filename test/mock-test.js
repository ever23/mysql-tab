const { describe, it } = require('node:test');
const assert = require('assert');
const mysqlTable = require('../mysql-tab');
const dbtabla = require('dbtabla');

describe('Verificación de mysql-tab mediante Mocking', () => {

    const mockConnection = {
        connect: (callback) => callback(null),
        query: (sql, config, callback) => {
            if (typeof config === 'function') callback = config;
            if (sql.includes("information_schema") && sql.includes("'usuarios'")) {
                const mockMetadata = [
                    { COLUMN_NAME: 'id', ORDINAL_POSITION: 1, COLUMN_TYPE: 'int', IS_NULLABLE: 'NO', COLUMN_KEY: 'PRI', EXTRA: 'auto_increment' },
                    { COLUMN_NAME: 'nombre', ORDINAL_POSITION: 2, COLUMN_TYPE: 'varchar(100)', IS_NULLABLE: 'YES', COLUMN_KEY: '', EXTRA: '' }
                ];
                return callback(null, mockMetadata);
            }
            callback(null, { insertId: 1, affectedRows: 1 }); // Resultado simulado de query
        },
        escape: (val) => `'${val}'`,
        config: { database: 'db_falsa' },
        end: () => {}
    };

    it('Debe generar un UPDATE asíncrono correctamente', async () => {
        const db = new mysqlTable({ host: 'localhost' }, false);
        db.connection = mockConnection;

        await new Promise((resolve, reject) => {
            db.tabla('usuarios', async (usuarios) => {
                try {
                    const result = await usuarios.update({ nombre: 'Pedro' }, { id: 1 });
                    
                    // Ahora verificamos la propiedad $sql del objeto retornado
                    const sqlUpdate = result.$sql;
                    
                    // Limpiamos espacios para evitar fallos por doble espacio
                    const cleanActual = sqlUpdate.replace(/\s+/g, ' ');
                    const expected = "UPDATE `usuarios` SET `nombre`='Pedro' WHERE `id`=1;";
                    const cleanExpected = expected.replace(/\s+/g, ' ');
                    
                    assert.equal(cleanActual, cleanExpected);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            }, true);
        });
    });
});
