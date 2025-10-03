import { defineStore } from "pinia";
import { ref } from "vue";

export const CodingStore = defineStore("coding-store", () => {
  const code = ref(
    "#include <iostream>\n" +
      "using namespace std;\n" +
      "int func(int n){\n" +
      " if(n>1){\n" +
      " return n*func(n-1);\n" +
      " }\n" +
      " return n;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "  int a=5;\n" +
      "  int b = func(a);\n" +
      '  printf("%d\\n",b);\n' +
      "  return 0;\n" +
      "}\n"
  );
  const input = ref("");
  const output = ref("");
  const isCompiling = ref(false);
  // 播放同步时间线: [{ t: number, code: string, input: string, output: string }]
  const timeline = ref<any[]>([]);
  const timelineOffset = ref(0); // 若最小 t > 0 或需要归零时保存偏移
  function loadTimeline(arr: any[]) {
    if (!Array.isArray(arr)) {
      timeline.value = [];
      timelineOffset.value = 0;
      return;
    }
    // 兼容两种结构：
    // A: [{t, code, input, output}]
    // B: [{t, leafId, tabs:[{path,label, code,input,output}]}]
    const flat: any[] = [];
    for (const item of arr) {
      if (item && typeof item === "object") {
        if (Array.isArray(item.tabs)) {
          // 找 CodeEditor / CodeInput / CodeOutput
          const codeTab = item.tabs.find((t: any) => t.path === "CodeEditor");
          const inputTab = item.tabs.find((t: any) => t.path === "CodeInput");
          const outputTab = item.tabs.find((t: any) => t.path === "CodeOutput");
          flat.push({
            t: Number(item.t) || 0,
            code: codeTab?.code ?? codeTab?.content ?? "",
            input: inputTab?.input ?? inputTab?.code ?? "",
            output: outputTab?.output ?? outputTab?.code ?? "",
            _reason: item.reason,
          });
        } else if ("t" in item) {
          flat.push({
            t: Number(item.t) || 0,
            code: item.code ?? "",
            input: item.input ?? "",
            output: item.output ?? "",
            _reason: item.reason,
          });
        }
      }
    }
    flat.sort((a, b) => a.t - b.t);
    if (flat.length) {
      const minT = flat[0].t;
      if (minT > 0) {
        timelineOffset.value = minT;
        for (const f of flat) f.t = +(f.t - minT).toFixed(3);
      } else timelineOffset.value = 0;
    } else timelineOffset.value = 0;
    timeline.value = flat;
    if (typeof window !== "undefined") {
      console.groupCollapsed(
        "%c[CodingStore] Normalized Timeline",
        "color:#8e44ad;font-weight:bold"
      );
      console.log("entries=", flat.length, "offset=", timelineOffset.value);
      console.table(
        flat
          .slice(0, 30)
          .map((s) => ({
            t: s.t,
            codeLen: s.code?.length || 0,
            reason: s._reason,
          }))
      );
      if (flat.length > 30) console.log("... total", flat.length);
      console.groupEnd();
    }
  }
  function resolveSegment(ts: number) {
    const arr = timeline.value;
    if (!arr.length) return null;
    let lo = 0,
      hi = arr.length - 1,
      ans = arr[0];
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const mt = +arr[mid].t;
      if (mt <= ts) {
        ans = arr[mid];
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }
  return {
    code,
    input,
    output,
    isCompiling,
    timeline,
    timelineOffset,
    loadTimeline,
    resolveSegment,
  };
});
