import type { Project } from "./types"

export const createProject = (name: string): Project => {
    console.log(name)
    return { name }
}