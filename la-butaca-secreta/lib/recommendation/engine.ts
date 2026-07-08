import { UserProfile } from "@/lib/conversation/types";

import {
  buildFilters,
  RecommendationFilters,
} from "./filters";

export class RecommendationEngine {
  constructor(
    private readonly profile: UserProfile
  ) {}

  public build(): RecommendationFilters {
    return buildFilters(this.profile);
  }
}