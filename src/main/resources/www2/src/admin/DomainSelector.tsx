import { Group, Input, MultiSelect, Select, SelectItem, Text } from "@mantine/core";
import React, { forwardRef, useCallback, useEffect, useState } from "react";
import { RsDomainRestApiView } from "../api";
import { Api } from "../apiUtils";

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
  image: string;
  label: string;
  description: string;
}

const DomainItem = forwardRef<HTMLDivElement, ItemProps>(
	({ label, description, ...others }: ItemProps, ref) => (
		<div ref={ref} {...others}>
			<Group noWrap>
				<div>
					<Text size="sm">{label}</Text>
					<Text size="xs" color="dimmed">{description}</Text>
				</div>
			</Group>
		</div>
	),
);

interface DomainSelectorProps {
	selectedIds: Array<number>;
	setSelectedIds: (ids: Array<number>) => void;
	maxSelectedIds?: number;
	clearable?: boolean;
	label?: string;
}

export function DomainSelector({ selectedIds, setSelectedIds, maxSelectedIds, clearable, label }: DomainSelectorProps) {
	const [domains, setDomains] = useState<Array<RsDomainRestApiView>>([]);

	const fetchDomains = useCallback(async () => {
		try {
			setDomains((await Api.admin.getDomains()).data);
		}
		catch (error: unknown) {
			// Ignore
		}
	}, []);

	useEffect(() => {
		fetchDomains();
	}, [fetchDomains]);

	const items: Array<SelectItem> = domains.map((domain) => ({
		value: String(domain.id),
		label: domain.name,
		description: domain.description,
	}));

	const select = (
		<MultiSelect
			value={selectedIds.map(s => String(s))}
			onChange={(values) => setSelectedIds(values.map(v => parseInt(v, 10)))}
			maxSelectedValues={maxSelectedIds}
			clearable={clearable}
			clearButtonLabel="Any domain"
			placeholder="Select a domain, or any"
			data={items}
			itemComponent={DomainItem}
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
