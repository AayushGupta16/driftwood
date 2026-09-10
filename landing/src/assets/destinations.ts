import { AudioIcon, ImageIcon, LinkIcon, RepoIcon, SkillIcon, VideoIcon } from "./icons";

export const ASSET_DESTINATIONS = [
  { id: "image", label: "Images", description: "Photos, screenshots, and graphics", icon: ImageIcon },
  { id: "video", label: "Videos", description: "Demos, walkthroughs, and clips", icon: VideoIcon },
  { id: "audio", label: "Audio", description: "Recordings, music, and voice clips", icon: AudioIcon },
  { id: "link", label: "Links", description: "Web pages and reference material", icon: LinkIcon },
  { id: "skill", label: "Skills", description: "Markdown instructions or skill archives", icon: SkillIcon },
  { id: "repo", label: "Repos", description: "Code archives or repository URLs", icon: RepoIcon },
] as const;
