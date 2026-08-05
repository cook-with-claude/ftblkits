import { describe, it, expect } from "vitest";
// @ts-expect-error -- plain .mjs module shared with the scraper script
import { parseTitle, clubsByToken, normalise } from "../scripts/supplier-titles.mjs";

const title = (s: string) => parseTitle(s);

describe("parseTitle", () => {
  it("reads club and variant off a well-formed title", () => {
    expect(title("26-27 Brighton Away Cheap Soccer Jerseys Yupoo")).toEqual({
      club: "Brighton & Hove Albion",
      variant: "Away",
    });
    expect(title("26-27 Celta Third Cheap Soccer Jerseys Yupoo")).toEqual({
      club: "Celta Vigo",
      variant: "Third",
    });
  });

  it("treats an unlabelled album as the home shirt", () => {
    // The supplier only spells out the variants that differ from home.
    expect(title("26-27 Real Madrid Cheap Soccer Jerseys Yupoo")).toEqual({
      club: "Real Madrid",
      variant: "Home",
    });
  });

  it("resolves supplier shorthand", () => {
    expect(title("26-27 Barc Home Cheap Soccer Jerseys Yupoo").club).toBe("Barcelona");
    expect(title("26-27 Man United Away Cheap Soccer Jerseys Yupoo").club).toBe("Manchester United");
    expect(title("26-27 Paris Home Cheap Soccer Jerseys Yupoo").club).toBe("Paris Saint-Germain");
    expect(title("26-27 Kolner Home Cheap Soccer Jerseys Yupoo").club).toBe("FC Köln");
  });

  it("ignores other seasons", () => {
    expect(title("25-26 Arsenal Home Cheap Soccer Jerseys Yupoo").skip).toBe("other-season");
  });

  it("survives the supplier's own typos in the marketing tail", () => {
    // Real titles from the album: "jer seys", "jerse ys".
    expect(title("26-27 New York City Home Cheap Soccer Jer seys").club).toBe("New York City FC");
    expect(title("26-27 Ipswich Away Cheap Soccer Jerse ys").club).toBe("Ipswich Town");
  });
});

describe("parseTitle rejects anything that is not a plain adult shirt", () => {
  const rejected = [
    "26-27 Las Palmas Away Kids Cheap Soccer Jerseys Yupoo",
    "26-27 Arsenal Home Player Version Cheap Soccer Jerseys Yupoo",
    "26-27 Real Madrid Training Soccer Suit Yupoo",
    "26-27 Ipswich Third Kids Cheap Soccer Jerseys and shorts Yupoo",
    "26-27 Paris Long Sleeve tracksuit Yupoo",
    "26-27 Real Madrid Windbreaker Jackets Yupoo",
    "26-27 Barcelona Women Home Cheap Soccer Jerseys Yupoo",
  ];
  for (const t of rejected) {
    it(`rejects: ${t.slice(0, 48)}`, () => {
      expect(title(t).skip).toBe("not-a-plain-shirt");
    });
  }

  it("rejects a hyphenated T-Shirt, which is a tee and not a jersey", () => {
    // Regression: this was spelled `t\s*shirts?`, and a hyphen is not
    // whitespace, so "26-27 Chelsea Soccer T-Shirts" was published as a home kit.
    expect(title("26-27 Chelsea Soccer T-Shirts Yupoo").skip).toBe("not-a-plain-shirt");
    expect(title("26-27 Chelsea Soccer T Shirts Yupoo").skip).toBe("not-a-plain-shirt");
  });
});

describe("club matching is exact, never substring", () => {
  // Each of these was mis-filed by an earlier substring pass. The club on the
  // left is not in the roster, and must not be swallowed by the one on the right.
  const traps: [string, string][] = [
    ["Romania", "Roma"],
    ["Bragantino", "Braga"],
    ["Brazil", "AZ"],
    ["Cruz Azul", "AZ"],
    ["Necaxa", "NEC"],
    ["Internacional", "Nacional"],
    ["Rangers", "Angers"],
  ];

  for (const [intruder, victim] of traps) {
    it(`does not file ${intruder} under ${victim}`, () => {
      const result = title(`26-27 ${intruder} Home Cheap Soccer Jerseys Yupoo`);
      expect(result.club).toBeUndefined();
      expect(result.skip).toBe("club-not-in-roster");
    });
  }

  it("still matches the clubs those traps were shadowing", () => {
    expect(title("26-27 Roma Away Cheap Soccer Jerseys Yupoo").club).toBe("Roma");
    expect(title("26-27 Braga Home Cheap Soccer Jerseys Yupoo").club).toBe("Braga");
    expect(title("26-27 AZ Home Cheap Soccer Jerseys Yupoo").club).toBe("AZ");
  });

  it("drops a variant it does not stock instead of defaulting it to Home", () => {
    // "Fourth" is not in KIT_VARIANTS, so the word stays in the club token and
    // fails the exact lookup -- which is the desired outcome, not a near miss.
    const result = title("26-27 Barcelona Fourth Cheap Soccer Jerseys Yupoo");
    expect(result.club).toBeUndefined();
  });
});

describe("alias table integrity", () => {
  it("normalises to bare lowercase tokens", () => {
    expect(normalise("Borussia Mönchengladbach")).toBe("borussia monchengladbach");
    expect(normalise("D.C. United")).toBe("d c united");
  });

  it("has every roster club reachable by its own name", () => {
    // Loading the module throws if an alias points at a club that left the
    // roster; this asserts the other direction stays true too.
    expect(clubsByToken.get("arsenal")).toBe("Arsenal");
    expect(clubsByToken.get("atletico madrid")).toBe("Atlético Madrid");
  });
});
