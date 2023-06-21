/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del()
  await knex('users').insert([
    {
      username: 'irwankautsar', 
      password: 'baksosolo', 
      status: 'Rektor', 
      email: 'irwan@umsida.ac.id', 
      nama: 'Irwan Alnarus Kautsar, S.Kom., M.Kom., Ph.D'
    },
    {
      username: 'admin', 
      password: 'password', 
      status: 'Admin', 
      email: 'admin@umsida.ac.id', 
      nama: 'Jenenge Admin'},
    {
      username: 'ramahilal', 
      password: 'ramahilal', 
      status: 'Mahasiswa', 
      email: 'ramahilal@gmail.com', 
      nama: 'Rama Hilal'
    }
  ]);
};
