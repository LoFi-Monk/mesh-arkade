import { describe, it, expect } from "vitest";
import {
  parseDat,
  parseClrmamepro,
  parseDatXml,
  extractRegion,
} from "../dat-parser.js";

describe("dat-parser.ts", () => {
  describe("parseClrmamepro", () => {
    it("should parse a basic CLRMamePro DAT file", () => {
      const content = `clrmamepro (
	name "Test System"
	description "Test System"
	category "Test"
)

game (
	name "Test Game 1"
	rom ( name "game.bin" size 1048576 crc 12345678 sha1 0000000000000000000000000000000000000000 )
)

game (
	name "Test Game 2"
	rom ( name "game2.bin" size 2097152 crc ABCDEF12 md5 00000000000000000000000000000000 )
)`;

      const result = parseClrmamepro(content);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Test Game 1");
      expect(result[0].crc).toBe("12345678");
      expect(result[0].sha1).toBe("0000000000000000000000000000000000000000");
      expect(result[1].name).toBe("Test Game 2");
      expect(result[1].crc).toBe("ABCDEF12");
      expect(result[1].md5).toBe("00000000000000000000000000000000");
    });

    it("should handle games without ROM info", () => {
      const content = `game (
	name "Game Without Rom"
)

game (
	name "Game With Rom"
	rom ( name "rom.bin" size 1024 crc DEADBEEF )
)`;

      const result = parseClrmamepro(content);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Game Without Rom");
      expect(result[0].sha1).toBeUndefined();
      expect(result[1].name).toBe("Game With Rom");
      expect(result[1].crc).toBe("DEADBEEF");
    });

    it("should handle multiple ROMs per game", () => {
      const content = `game (
	name "Multi Disc Game"
	rom ( name "disc1.bin" size 100 crc AAAAAA01 sha1 1111111111111111111111111111111111111111 )
	rom ( name "disc2.bin" size 200 crc BBBBBB02 sha1 2222222222222222222222222222222222222222 )
)`;

      const result = parseClrmamepro(content);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Multi Disc Game");
    });

    it("should handle game names with parentheses", () => {
      const content = `game (
	name "Game (USA) (Rev A)"
	rom ( name "game.bin" size 1024 crc CAFEBABE )
)`;

      const result = parseClrmamepro(content);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Game (USA) (Rev A)");
    });

    it("should return empty array for invalid content", () => {
      const result = parseClrmamepro("not a valid dat file");
      expect(result).toHaveLength(0);
    });

    it("should return empty array for empty content", () => {
      const result = parseClrmamepro("");
      expect(result).toHaveLength(0);
    });
  });

  describe("parseDatXml", () => {
    it("should parse a basic XML DAT file", () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<datafile>
  <header>
    <name>Test System</name>
    <description>Test System</description>
  </header>
  <game name="Game 1">
    <rom name="game1.bin" size="1048576"/>
    <sha1>0000000000000000000000000000000000000000</sha1>
    <crc>12345678</crc>
    <md5>00000000000000000000000000000000</md5>
  </game>
  <game name="Game 2">
    <rom name="game2.bin" size="2097152"/>
    <crc>ABCDEF12</crc>
  </game>
</datafile>`;

      const result = parseDatXml(content);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Game 1");
      expect(result[0].crc).toBe("12345678");
      expect(result[0].sha1).toBe("0000000000000000000000000000000000000000");
      expect(result[0].md5).toBe("00000000000000000000000000000000");
      expect(result[1].name).toBe("Game 2");
      expect(result[1].crc).toBe("ABCDEF12");
    });

    it("should handle games without ROM info", () => {
      const content = `<?xml version="1.0"?>
<datafile>
  <game name="Game Without Rom"/>
  <game name="Game With Rom">
    <rom name="rom.bin" size="1024"/>
    <crc>DEADBEEF</crc>
  </game>
</datafile>`;

      const result = parseDatXml(content);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Game Without Rom");
      expect(result[0].sha1).toBeUndefined();
      expect(result[1].name).toBe("Game With Rom");
      expect(result[1].crc).toBe("DEADBEEF");
    });

    it("should return empty array for invalid XML", () => {
      const result = parseDatXml("not xml content");
      expect(result).toHaveLength(0);
    });

    it("should return empty array for empty content", () => {
      const result = parseDatXml("");
      expect(result).toHaveLength(0);
    });
  });

  describe("parseDat", () => {
    it("should dispatch to parseClrmamepro for clrmamepro header", () => {
      const content = `clrmamepro (
	name "Test"
)
game (
	name "Test Game"
	rom ( name "test.bin" size 1024 crc A1B2C3D4 )
)`;

      const result = parseDat(content);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Game");
    });

    it("should dispatch to parseClrmamepro for game ( pattern", () => {
      const content = `game (
	name "Test Game"
	rom ( name "test.bin" size 1024 crc A1B2C3D4 )
)`;

      const result = parseDat(content);
      expect(result).toHaveLength(1);
    });

    it("should dispatch to parseDatXml for XML content", () => {
      const content = `<?xml version="1.0"?>
<datafile>
  <game name="Test Game">
    <rom name="test.bin" size="1024" crc="A1B2C3D4"/>
  </game>
</datafile>`;

      const result = parseDat(content);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Game");
    });
  });

  describe("extractRegion", () => {
    it("should extract USA region", () => {
      expect(extractRegion("Game (USA)")).toBe("USA");
      expect(extractRegion("Game (USA) (Rev A)")).toBe("USA");
    });

    it("should extract Europe region", () => {
      expect(extractRegion("Game (Europe)")).toBe("Europe");
    });

    it("should extract Japan region", () => {
      expect(extractRegion("Game (Japan)")).toBe("Japan");
    });

    it("should extract World region", () => {
      expect(extractRegion("Game (World)")).toBe("World");
    });

    it("should extract Revision", () => {
      expect(extractRegion("Game (Rev A)")).toBe("Rev A");
      expect(extractRegion("Game (Rev B)")).toBe("Rev B");
    });

    it("should extract Alt", () => {
      expect(extractRegion("Game (Alt)")).toBe("Alt");
    });

    it("should extract Beta", () => {
      expect(extractRegion("Game (Beta)")).toBe("Beta");
    });

    it("should extract Demo", () => {
      expect(extractRegion("Game (Demo)")).toBe("Demo");
    });

    it("should extract Proto", () => {
      expect(extractRegion("Game (Proto)")).toBe("Proto");
    });

    it("should return Unknown for no region", () => {
      expect(extractRegion("Game Title")).toBe("Unknown");
      expect(extractRegion("")).toBe("Unknown");
    });

    it("should be case insensitive", () => {
      expect(extractRegion("Game (usa)")).toBe("usa");
      expect(extractRegion("Game (USA)")).toBe("USA");
    });
  });
});
