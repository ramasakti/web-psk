/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('pesan', function(table) {
        table.increments('id_pesan');
        table.string('pengirim').notNullable();
        table.string('penerima').notNullable();
        table.text('pesan', 'longtext').notNullable();
        table.text('balasan', 'longtext');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('pesan');
};
