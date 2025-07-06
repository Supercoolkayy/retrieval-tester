import { TestResult, Config } from "./types.js";
export declare const defaultEndpoints: string[];
export declare function testRetrieval(cid: string, endpoints: string[], config?: Partial<Config>): Promise<TestResult[]>;
