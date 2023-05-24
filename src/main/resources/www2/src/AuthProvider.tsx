import React, { useCallback, useEffect, useState } from "react";
import globalAxios, { AxiosResponse, AxiosRequestConfig, AxiosError } from "axios";

import { RsServerInfoRestApiView, UiUserRestApiView } from "./api";
import { Location, Navigate, useLocation, useNavigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import { Button, Group, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { Api } from "./apiUtils";
import { ForbiddenPage } from "./ForbiddenPage";
import { IconAlarm } from "@tabler/icons-react";


type AuthStatus = "init" | "server-error" | "connected" | "disconnected";

interface AuthContextType {
	currentUser?: UiUserRestApiView;
	serverInfo?: RsServerInfoRestApiView;
	status: AuthStatus;
	login: (username: string, password: string) => Promise<UiUserRestApiView | null>;
	logout: () => Promise<void>;
}

interface RedirectData {
	from: Location,
}

interface TaggedAxiosRequestConfig<T> extends AxiosRequestConfig<T> {
	tag?: string;
}

const AuthContext = React.createContext<AuthContextType>({
	status: "init",
	login: async (username: string, password: string) => null,
	logout: async () => { /* */ },
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
	const [currentUser, setCurrentUser] = useState<UiUserRestApiView | undefined>();
	const [serverInfo, setServerInfo] = useState<RsServerInfoRestApiView | undefined>();
	const [status, setStatus] = useState<AuthStatus>("init");
	const navigate = useNavigate();
	const location = useLocation();
	const from = (location.state as RedirectData)?.from?.pathname || "/";
	const [idleTimeoutStart, setIdleTimeoutStart] = useState<number>(0);

	const fetchInfo = useCallback(async () => {
		try {
			const config: TaggedAxiosRequestConfig<undefined> = {
				tag: "LOGIN_CHECK",
			};
			const user = (await Api.login.getUser(config)).data;
			setCurrentUser(user);
			const info = (await Api.admin.getServerInfo()).data;
			setServerInfo(info);
			setStatus("connected");
		}
		catch (error: unknown) {
			if (error instanceof AxiosError) {
				setCurrentUser(undefined);
				setServerInfo(undefined);
				setStatus(error.response?.status === 403 ? "disconnected" : "server-error");
			}
		}
	}, []);

	const login = useCallback(async (username: string, password: string) => {
		try {
			const user = (await Api.login.login({
				username,
				password,
			})).data;
			setCurrentUser(user);
			const info = (await Api.admin.getServerInfo()).data;
			setServerInfo(info);
			setStatus("connected");
			navigate(from, { replace: true });
			return user;
		}
		catch (error: unknown) {
			if (error instanceof AxiosError) {
				setStatus(error.response?.status === 401 ? "disconnected" : "server-error");
			}
		}
		return null;
	}, [from, navigate]);

	const logout = useCallback(async() => {
		try {
			await Api.login.logout(0);
		}
		finally {
			setCurrentUser(undefined);
			setStatus("disconnected");
		}
	}, []);

	useEffect(() => {
		fetchInfo();
	}, [fetchInfo]);

	const showTimeoutNotification = useCallback(() => {
		showNotification({
			id: "idle-timeout",
			title: "Session expired due to inactivity",
			message: (
				<Group position="apart">
					<Text inherit>You need to authenticate.</Text>
					<Button
						variant="subtle"
						size="xs"
						onClick={() => window.location.reload()}
					>
						Reload the page
					</Button>
				</Group>
			),
			color: "orange",
			icon: <IconAlarm />,
			autoClose: false,
		});
	}, []);

	useEffect(() => {
		let idleTimeoutId: number | undefined = undefined;
		if (serverInfo?.maxIdleTimout) {
			idleTimeoutId = setTimeout(() => {
				showTimeoutNotification();
			}, serverInfo.maxIdleTimout * 1000);
		}
		return () => {
			clearTimeout(idleTimeoutId);
		}
	}, [serverInfo, idleTimeoutStart, showTimeoutNotification]);

	useEffect(() => {
		const resCallback = globalAxios.interceptors.response.use((response: AxiosResponse<unknown>) => {
			setIdleTimeoutStart(Date.now());
			return response;
		}, (error: unknown) => {
			if (error instanceof AxiosError && error.response && error.response.status === 403) {
				if (!(error.config && (error.config as TaggedAxiosRequestConfig<undefined>).tag === "LOGIN_CHECK")) {
					// if no login check, redirect to login page
					showTimeoutNotification();
				}
			}
			return Promise.reject(error);
		});
		return () => {
			globalAxios.interceptors.response.eject(resCallback);
		};
	}, [currentUser, location.pathname, showTimeoutNotification]);

	const value = {
		currentUser,
		serverInfo,
		status,
		login,
		logout,
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextType {
	return React.useContext(AuthContext);
}

interface AuthLevelRequiredProps {
	level: number,
	children: JSX.Element,
}

export function AuthLevelRequired({ level, children }: AuthLevelRequiredProps) {
	const auth = useAuth();
	const location = useLocation();

	if (auth.status === "init") {
		return (
			<LoginPage />
		);
	}

	if (!auth.currentUser || auth.currentUser.level === undefined) {
		// Redirect them to the /login page, but save the current location they were
		// trying to go to when they were redirected. This allows us to send them
		// along to that page after they login, which is a nicer user experience
		// than dropping them off on the home page.
		const redirectData: RedirectData = {
			from: location,
		};
		return <Navigate to="/login" state={redirectData} replace />;
	}

	if (auth.currentUser.level < level) {
		return (
			<ForbiddenPage />
		);
	}

	return children;
}

interface AuthdSectionProps {
	minLevel?: number,
	children: JSX.Element,
}

export function AuthdSection({ minLevel, children }: AuthdSectionProps) {
	const auth = useAuth();

	if (minLevel) {
		if (!auth.currentUser || !auth.currentUser.level || auth.currentUser.level < minLevel) {
			return null;
		}
	}

	return children;
}

export enum UserLevel {
	READONLY = 10,
	OPERATOR = 50,
	READWRITE = 100,
	EXECUTEREADWRITE = 500,
	ADMIN = 1000,
}

export const UserLevelDescs : Array<[string, string, number]> = [
	["Visitor", "RO", UserLevel.READONLY],
	["Operator", "OP", UserLevel.OPERATOR],
	["Read-Write", "RW", UserLevel.READWRITE],
	["Exec-Read-Write", "XRW", UserLevel.EXECUTEREADWRITE],
	["Admin", "ADM", UserLevel.ADMIN],
];
