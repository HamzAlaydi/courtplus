import { Select, Spin } from "antd";
import { getCustomersByUsername } from "../../actions/customers.action";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function CustomersSelect({ onChange }) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () =>
      getCustomersByUsername({
        params: { pageSize: 20, page: 1, search: search },
      }),
    keepPreviousData: true,
  });

  // Convert fetched users to options
  const options = (data?.items || []).map((user) => ({
    label: user.username || user.firstName + "" + user.lastName,
    value: user.id,
  }));

  const handleSearch = (searchValue) => {
    setSearch(searchValue);
  };

  return (
    <Select
      mode="multiple"
      showSearch
      allowClear
      placeholder="Search and select users"
      style={{ width: "100%" }}
      filterOption={false}
      notFoundContent={isLoading ? <Spin size="small" /> : null}
      onSearch={handleSearch}
      onChange={onChange} // this returns array of selected ids
      options={options}
    />
  );
}
