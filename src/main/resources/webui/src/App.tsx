import { ProtectedRoute } from "@/components";
import { AuthProvider } from "@/contexts";
import { DialogProvider } from "@/dialog";
import {
  AdministrationApiTokenScreen,
  AdministrationClusteringScreen,
  AdministrationDeviceCredentialScreen,
  AdministrationDomainScreen,
  AdministrationDriverScreen,
  AdministrationScreen,
  AdministrationUserScreen,
  AdministrationWebhookScreen,
} from "@/features/administration";
import {
  ComplianceDetailScreen,
  ComplianceHardwareRuleScreen,
  ComplianceScreen,
  ComplianceSoftwareRuleScreen,
} from "@/features/compliance";
import {
  DeviceComplianceScreen,
  DeviceConfigurationScreen,
  DeviceDetailScreen,
  DeviceDiagnosticScreen,
  DeviceGeneralScreen,
  DeviceInterfaceScreen,
  DeviceModuleScreen,
  DeviceScreen,
  DeviceTaskScreen,
} from "@/features/device";
import {
  DiagnosticDetailScreen,
  DiagnosticScreen,
} from "@/features/diagnostic";
import {
  ReportConfigurationChangeScreen,
  ReportConfigurationComplianceDetailScreen,
  ReportConfigurationComplianceEmptyScreen,
  ReportConfigurationComplianceScreen,
  ReportDeviceAccessFailureScreen,
  ReportHardwareSupportStatusScreen,
  ReportScreen,
  ReportSoftwareComplianceScreen,
} from "@/features/report";
import {
  AllTaskScreen,
  CancelledTaskScreen,
  FailedTaskScreen,
  RunningTaskScreen,
  ScheduledTaskScreen,
  SucceededTaskScreen,
  TaskScreen,
} from "@/features/task";
import i18n from "@/i18n";
import { MainScreen, SigninScreen } from "@/screens";
import theme from "@/theme";
import { Level } from "@/types";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      structuralSharing: false,
      retryOnMount: true,
      retry: 0,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ChakraProvider theme={theme}>
          <BrowserRouter>
            <AuthProvider>
              <DialogProvider>
                <Routes>
                  <Route path="signin" element={<SigninScreen />} />
                  <Route path="app" element={<MainScreen />}>
                    <Route index element={<Navigate to="reports" />} />
                    <Route path="reports" element={<ReportScreen />}>
                      <Route
                        index
                        element={<Navigate to="configuration-change" />}
                      />
                      <Route
                        path="configuration-change"
                        element={<ReportConfigurationChangeScreen />}
                      />
                      <Route
                        path="device-access-failure"
                        element={<ReportDeviceAccessFailureScreen />}
                      />
                      <Route
                        path="configuration-compliance"
                        element={<ReportConfigurationComplianceScreen />}
                      >
                        <Route
                          index
                          element={
                            <ReportConfigurationComplianceEmptyScreen />
                          }
                        />
                        <Route
                          path=":id"
                          element={
                            <ReportConfigurationComplianceDetailScreen />
                          }
                        />
                      </Route>
                      <Route
                        path="software-compliance"
                        element={<ReportSoftwareComplianceScreen />}
                      />
                      <Route
                        path="hardware-support-status"
                        element={<ReportHardwareSupportStatusScreen />}
                      />
                    </Route>
                    <Route path="devices" element={<DeviceScreen />}>
                      <Route path=":id" element={<DeviceDetailScreen />}>
                        <Route index element={<Navigate to="general" />} />
                        <Route
                          path="general"
                          element={<DeviceGeneralScreen />}
                        />
                        <Route
                          path="configurations"
                          element={<DeviceConfigurationScreen />}
                        />
                        <Route
                          path="interfaces"
                          element={<DeviceInterfaceScreen />}
                        />
                        <Route
                          path="modules"
                          element={<DeviceModuleScreen />}
                        />
                        <Route
                          path="diagnostics"
                          element={<DeviceDiagnosticScreen />}
                        />
                        <Route
                          path="compliance"
                          element={<DeviceComplianceScreen />}
                        />
                        <Route path="tasks" element={<DeviceTaskScreen />} />
                      </Route>
                    </Route>
                    <Route path="diagnostics" element={<DiagnosticScreen />}>
                      <Route
                        path=":id"
                        element={<DiagnosticDetailScreen />}
                      />
                    </Route>
                    <Route path="compliance" element={<ComplianceScreen />}>
                      <Route
                        path="hardware"
                        element={<ComplianceHardwareRuleScreen />}
                      />
                      <Route
                        path="software"
                        element={<ComplianceSoftwareRuleScreen />}
                      />
                      <Route
                        path="config/:policyId/:ruleId"
                        element={<ComplianceDetailScreen />}
                      />
                      <Route index element={<Navigate to="software" />} />
                    </Route>
                    <Route path="tasks" element={<TaskScreen />}>
                      <Route index element={<Navigate to="all" />} />
                      <Route path="all" element={<AllTaskScreen />} />
                      <Route path="running" element={<RunningTaskScreen />} />
                      <Route
                        path="scheduled"
                        element={<ScheduledTaskScreen />}
                      />
                      <Route
                        path="succeeded"
                        element={<SucceededTaskScreen />}
                      />
                      <Route path="failed" element={<FailedTaskScreen />} />
                      <Route
                        path="cancelled"
                        element={<CancelledTaskScreen />}
                      />
                    </Route>
                      <Route element={<ProtectedRoute minLevel={Level.Admin} />}>
                      <Route
                        path="administration"
                        element={<AdministrationScreen />}
                      >
                        <Route index element={<Navigate to="user" />} />
                        <Route
                          path="user"
                          element={<AdministrationUserScreen />}
                        />
                        <Route
                          path="device-domain"
                          element={<AdministrationDomainScreen />}
                        />
                        <Route
                          path="device-credential"
                          element={<AdministrationDeviceCredentialScreen />}
                        />
                        <Route
                          path="driver"
                          element={<AdministrationDriverScreen />}
                        />
                        <Route
                          path="api-token"
                          element={<AdministrationApiTokenScreen />}
                        />
                        <Route
                          path="webhook"
                          element={<AdministrationWebhookScreen />}
                        />
                        <Route
                          path="clustering"
                          element={<AdministrationClusteringScreen />}
                        />
                      </Route>
                    </Route>
                  </Route>
                  <Route path="/" element={<Navigate to="app" />} />
                </Routes>
              </DialogProvider>
            </AuthProvider>
          </BrowserRouter>
        </ChakraProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
