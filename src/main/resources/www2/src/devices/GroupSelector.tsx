import { Group, Input, MultiSelect, SelectItem, Text } from "@mantine/core";
import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { RsDeviceGroupRestApiView } from "../api";
import { Api } from "../apiUtils";

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
  image: string;
  label: string;
  folder: string;
}

const GroupItem = forwardRef<HTMLDivElement, ItemProps>(
	({ label, folder, ...others }: ItemProps, ref) => (
		<div ref={ref} {...others}>
			<Group noWrap>
				<div>
					<Text size="xs" color="dimmed">{folder}</Text>
					<Text size="sm">{label}</Text>
				</div>
			</Group>
		</div>
	),
);

interface GroupSelectorProps {
	selectedIds: Array<number>;
	setSelectedIds: (ids: Array<number>) => void;
	maxSelectedIds?: number;
	clearable?: boolean;
	label?: string;
}

export function GroupSelector({ selectedIds, setSelectedIds, maxSelectedIds, clearable, label }: GroupSelectorProps) {
	const [groups, setGroups] = useState<Array<RsDeviceGroupRestApiView>>([]);

	const fetchGroups = useCallback(async () => {
		try {
			setGroups((await Api.devices.getGroups()).data);
		}
		catch (error: unknown) {
			// Ignore
		}
	}, []);

	useEffect(() => {
		fetchGroups();
	}, [fetchGroups]);

	const items: Array<SelectItem> = groups.map((group) => ({
		value: String(group.id),
		label: group.name,
		group: (group.folder || "").split("/").map(f => f.trim()).filter(f => !!f).join("/"),
	}));

	const select = (
		<MultiSelect
			value={selectedIds.map(s => String(s))}
			onChange={(values) => setSelectedIds(values.map(v => parseInt(v, 10)))}
			maxSelectedValues={maxSelectedIds}
			clearable={clearable}
			clearButtonLabel="Any group"
			placeholder="Select a group, or any"
			data={items}
			itemComponent={GroupItem}
			maxDropdownHeight={400}
		/>
	);

	if (label) {
		return (
			<Input.Wrapper label={label}>{select}</Input.Wrapper>
		);
	}

	return select;
}
