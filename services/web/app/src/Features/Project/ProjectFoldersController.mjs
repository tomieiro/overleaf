import SessionManager from '../Authentication/SessionManager.mjs'
import TagsHandler from '../Tags/TagsHandler.mjs'
import Errors from '../Errors/Errors.js'
import { Project } from '../../models/Project.mjs'
import { z, parseReq } from '../../infrastructure/Validation.mjs'
import { expressify } from '@overleaf/promise-utils'

async function listFolders(req, res) {
  const userId = SessionManager.getLoggedInUserId(req.session)
  if (!userId) throw new Errors.NotFoundError()
  const folders = await TagsHandler.promises.getAllTags(userId)
  res.json(folders)
}

const createFolderSchema = z.object({
  body: z.object({
    name: z.string(),
  }),
})

async function createFolder(req, res) {
  const { body } = parseReq(req, createFolderSchema)
  const userId = SessionManager.getLoggedInUserId(req.session)
  const folder = await TagsHandler.promises.createTag(userId, body.name)
  res.json(folder)
}

const updateFolderSchema = z.object({
  params: z.object({
    folderId: z.string(),
  }),
  body: z.object({
    name: z.string(),
  }),
})

async function updateFolder(req, res) {
  const { params, body } = parseReq(req, updateFolderSchema)
  const userId = SessionManager.getLoggedInUserId(req.session)
  await TagsHandler.promises.renameTag(userId, params.folderId, body.name)
  res.status(204).end()
}

const deleteFolderSchema = z.object({
  params: z.object({
    folderId: z.string(),
  }),
})

async function deleteFolder(req, res) {
  const { params } = parseReq(req, deleteFolderSchema)
  const userId = SessionManager.getLoggedInUserId(req.session)
  await TagsHandler.promises.deleteTag(userId, params.folderId)
  res.status(204).end()
}

const updateProjectFolderSchema = z.object({
  params: z.object({
    projectId: z.string(),
  }),
  body: z.object({
    folderId: z.string().nullable().optional(),
  }),
})

async function updateProjectFolder(req, res) {
  const { params, body } = parseReq(req, updateProjectFolderSchema)
  const userId = SessionManager.getLoggedInUserId(req.session)

  const project = await Project.findOne({
    _id: params.projectId,
    owner_ref: userId,
  }).select('_id')

  if (!project) {
    throw new Errors.ForbiddenError()
  }

  await TagsHandler.promises.removeProjectFromAllTags(userId, params.projectId)

  if (body.folderId) {
    await TagsHandler.promises.addProjectToTag(userId, body.folderId, params.projectId)
  }

  res.status(204).end()
}

export default {
  listFolders: expressify(listFolders),
  createFolder: expressify(createFolder),
  updateFolder: expressify(updateFolder),
  deleteFolder: expressify(deleteFolder),
  updateProjectFolder: expressify(updateProjectFolder),
}
