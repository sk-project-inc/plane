import React, { Fragment, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useCycle, useIssues } from "hooks/store";
// components
import {
  CycleAppliedFiltersRoot,
  CycleCalendarLayout,
  CycleEmptyState,
  CycleGanttLayout,
  CycleKanBanLayout,
  CycleListLayout,
  CycleSpreadsheetLayout,
  IssuePeekOverview,
} from "components/issues";
import { TransferIssues, TransferIssuesModal } from "components/cycles";
import { ActiveLoader } from "components/ui";
// ui
import { Spinner } from "@plane/ui";
// constants
import { EIssuesStoreType } from "constants/issue";

export const CycleLayoutRoot: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;
  // store hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { getCycleById } = useCycle();
  // state
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);

  useSWR(
    workspaceSlug && projectId && cycleId
      ? `CYCLE_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}_${cycleId.toString()}`
      : null,
    async () => {
      if (workspaceSlug && projectId && cycleId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString(), cycleId.toString());
        await issues?.fetchIssues(
          workspaceSlug.toString(),
          projectId.toString(),
          issues?.groupedIssueIds ? "mutation" : "init-loader",
          cycleId.toString()
        );
      }
    }
  );

  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase() ?? "draft";

  if (!workspaceSlug || !projectId || !cycleId) return <></>;

  if (issues?.loader === "init-loader" || !issues?.groupedIssueIds) {
    return (
      <>
        {activeLayout ? (
          <ActiveLoader layout={activeLayout} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <TransferIssuesModal handleClose={() => setTransferIssuesModal(false)} isOpen={transferIssuesModal} />
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        {cycleStatus === "completed" && <TransferIssues handleClick={() => setTransferIssuesModal(true)} />}
        <CycleAppliedFiltersRoot />

        {issues?.groupedIssueIds?.length === 0 ? (
          <div className="relative h-full w-full overflow-y-auto">
            <CycleEmptyState
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              cycleId={cycleId.toString()}
              activeLayout={activeLayout}
            />
          </div>
        ) : (
          <Fragment>
            <div className="h-full w-full overflow-auto">
              {activeLayout === "list" ? (
                <CycleListLayout />
              ) : activeLayout === "kanban" ? (
                <CycleKanBanLayout />
              ) : activeLayout === "calendar" ? (
                <CycleCalendarLayout />
              ) : activeLayout === "gantt_chart" ? (
                <CycleGanttLayout />
              ) : activeLayout === "spreadsheet" ? (
                <CycleSpreadsheetLayout />
              ) : null}
            </div>
            {/* peek overview */}
            <IssuePeekOverview />
          </Fragment>
        )}
      </div>
    </>
  );
});
