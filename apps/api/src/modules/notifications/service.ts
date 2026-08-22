import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../utils/httpError.js';

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markNotificationAsRead(userId: string, id: string) {
  const notificacion = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notificacion) throw HttpError.notFound('Notificacion no encontrada');

  return prisma.notification.update({
    where: { id },
    data: { leida: true },
  });
}
