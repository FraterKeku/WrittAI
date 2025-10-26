export enum AppState {
  HOME = 'HOME',
  WRITING = 'WRITING',
  UPLOAD_PROMPT = 'UPLOAD_PROMPT',
  FINAL_REVIEW = 'FINAL_REVIEW',
}

export enum HomeTab {
  CREATE = 'CREATE',
  LIBRARY = 'LIBRARY',
}

export enum Phase {
  BEGINNING = 'BEGINNING',
  MIDDLE = 'MIDDLE',
  END = 'END',
}

export interface BookDetails {
  title: string;
  objective: string;
  estimatedPages: number;
}

export interface LibraryBook {
  id: number;
  title: string;
  objective: string;
  content: string;
  createdAt: Date;
}