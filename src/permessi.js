const { PermissionFlagsBits } = require('discord.js');

function isStaff(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const staffRoleId = process.env.STAFF_ROLE_ID;
  if (!staffRoleId) return false;
  return member.roles.cache.has(staffRoleId);
}

module.exports = { isStaff };
