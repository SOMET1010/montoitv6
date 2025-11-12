// Temporary disable problematic repositories until database schema is updated
// This file allows the project to compile for development

export const tempRepository = {
  async getById(id: string) {
    return { data: null, error: new Error('Repository temporarily disabled') };
  },
  async getAll() {
    return { data: [], error: null };
  },
  async create(data: any) {
    return { data: null, error: new Error('Repository temporarily disabled') };
  },
  async update(id: string, data: any) {
    return { data: null, error: new Error('Repository temporarily disabled') };
  },
  async delete(id: string) {
    return { data: null, error: new Error('Repository temporarily disabled') };
  },
};