<template>
  <div>
    <vue-mindmap :nodes="nodes" :edges="edges" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      nodes: [
        { id: 1, label: "Root" },
        { id: 2, label: "Child 1", parent: 1 },
        { id: 3, label: "Child 2", parent: 1 },
      ],
      edges: [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
      ],
    };
  },
};
</script>
