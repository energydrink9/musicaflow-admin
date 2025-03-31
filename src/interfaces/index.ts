export interface ILevel {
  _id: string;
  name: string;
  description: string;
  index: number;
  steps: IStep[];
}

export interface IStep {
  _id: string;
  levelId: string;
  type: "Song" | "Exercise";
  index: number;
  name: string;
  description: string;
  scoreId?: string;
}

export interface IScore {
  _id: string;
  data: string; // base64 encoded MusicXML
}
