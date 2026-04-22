<template>
  <section class="panel flex flex-col h-full overflow-hidden">
    <div class="panel-header">
      <div class="flex items-center gap-2">
        <span>状态监控</span>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <MetricsChartPanel class="h-full" />
    </div>
  </section>
</template>
