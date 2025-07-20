export const createNoteEndpoint = '/notes';
export const getAllNotesEndpoint = '/notes';
export const getNoteByIdEndpoint = (id:string) => {return `/notes/${id}`};
export const updateNoteByIdEndpoint = (id:string) => {return `/notes/${id}`};
export const deleteNoteByIdEndpoint = (id:string) => {return `/notes/${id}`};
export const searchNoteEndpoint ='/notes/search';
export const shareNoteEndpoint = (id:string) => {return `/notes/${id}/share`};
export const getNoteUsersEndpoint = (id:string) => {return `/notes/${id}/shared-with`};
