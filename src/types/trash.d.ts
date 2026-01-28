declare module 'trash' {
  type TrashOptions = {
    glob?: boolean;
  };

  export default function trash(paths: string[], options?: TrashOptions): Promise<string[]>;
}
