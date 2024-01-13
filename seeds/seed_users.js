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
      status: 'Dosen', 
      email: 'irwan@umsida.ac.id', 
      nama: 'Irwan Alnarus Kautsar, S.Kom., M.Kom., Ph.D'
    },
    {
      username: 'hidayatulloh', 
      password: 'hidayatulloh', 
      status: 'Rektor', 
      email: 'rektor@umsida.ac.id', 
      nama: 'Dr. Hidayatulloh, M.Sc'
    },
    {
      username: 'admin', 
      password: 'password', 
      status: 'Admin', 
      email: 'admin@umsida.ac.id', 
      nama: 'Admin'},
    {
      username: 'ramasakti', 
      password: 'ramasakti', 
      status: 'Mahasiswa', 
      email: 'ramasakti1337@gmail.com', 
      nama: 'Rama Sakti'
    },
    {
      username: 'hilal', 
      password: 'hilal', 
      status: 'Mahasiswa', 
      email: 'hilal@gmail.com', 
      nama: 'Hilal Hamdi'
    }
  ]);
};
