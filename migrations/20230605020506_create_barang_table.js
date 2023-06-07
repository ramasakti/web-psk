/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('barang', function(table) {
        table.increments('id_barang');
        table.string('nama_barang').notNullable();
        table.text('gambar_barang', 'longtext').notNullable();
        table.integer('harga').notNullable();
        table.integer('stok').notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('barang');
};
