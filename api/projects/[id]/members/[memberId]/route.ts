// api/projects/[id]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '../../../../../lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findFirst({ where: { email: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Admin only
  const myMembership = await prisma.projectMember.findFirst({ where: { project_id: params.id, user_id: user.id, role: 'admin' } })
  if (!myMembership) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await req.json()
  const updated = await prisma.projectMember.update({
    where: { id: params.memberId },
    data: {
      ...(body.assigned_subtopic !== undefined && { assigned_subtopic: body.assigned_subtopic }),
      ...(body.section_status && { section_status: body.section_status }),
    },
    include: { user: true },
  })

  // Also update the section's subtopic if it exists
  if (body.assigned_subtopic !== undefined) {
    await prisma.section.updateMany({
      where: { project_id: params.id, member_id: updated.user_id },
      data: { subtopic: body.assigned_subtopic },
    })
  }

  return NextResponse.json(updated)
}
