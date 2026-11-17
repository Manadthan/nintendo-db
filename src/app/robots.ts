import type { MetadataRoute } from "next";
import { reglesRobots } from "@/lib/referencement/referencement";

export default function robots(): MetadataRoute.Robots {
  return reglesRobots();
}
