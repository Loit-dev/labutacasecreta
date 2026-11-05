import {
  BanIcon,
  BoltIcon,
  BookmarkIcon,
  BrainIcon,
  BulbIcon,
  CameraIcon,
  CheersIcon,
  ChristmasTreeIcon,
  ClapperIcon,
  CompassIcon,
  CowboyHatIcon,
  CrimeIcon,
  FamilyIcon,
  FireIcon,
  GhostIcon,
  HeartIcon,
  LaughIcon,
  MasksIcon,
  MusicNoteIcon,
  PaletteIcon,
  PersonIcon,
  RocketIcon,
  ScrollIcon,
  SearchIcon,
  ShareIcon,
  StarFilledIcon,
  SwordsIcon,
  TrophyIcon,
  WizardHatIcon,
} from "@/components/icons/Icons";
import type { ComponentType } from "react";
import type { IconName } from "@/lib/achievements/catalog";

type IconProps = { size?: number; className?: string };

const REGISTRY: Record<IconName, ComponentType<IconProps>> = {
  clapper: ClapperIcon,
  trophy: TrophyIcon,
  fire: FireIcon,
  star: StarFilledIcon,
  ban: BanIcon,
  brain: BrainIcon,
  compass: CompassIcon,
  person: PersonIcon,
  cheers: CheersIcon,
  share: ShareIcon,
  bulb: BulbIcon,
  bookmark: BookmarkIcon,
  bolt: BoltIcon,
  search: SearchIcon,
  laugh: LaughIcon,
  ghost: GhostIcon,
  masks: MasksIcon,
  heart: HeartIcon,
  family: FamilyIcon,
  palette: PaletteIcon,
  crime: CrimeIcon,
  camera: CameraIcon,
  wizardHat: WizardHatIcon,
  scroll: ScrollIcon,
  rocket: RocketIcon,
  musicNote: MusicNoteIcon,
  swords: SwordsIcon,
  cowboyHat: CowboyHatIcon,
  christmasTree: ChristmasTreeIcon,
};

type Props = { icon: IconName; size?: number; className?: string };

export default function AchievementIcon({ icon, size, className }: Props) {
  const Icon = REGISTRY[icon];

  return <Icon size={size} className={className} />;
}
