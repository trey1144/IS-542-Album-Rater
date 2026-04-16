import { Button, FormControl, InputGroup } from "react-bootstrap";

type SearchFormProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSearch: () => void;
};

export default function SearchForm({
  searchTerm,
  setSearchTerm,
  onSearch,
}: SearchFormProps) {
  return (
    <InputGroup className="mb-3">
      <FormControl
        placeholder="Search albums..."
        type="search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onKeyPress={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSearch();
          }
        }}
      />
      <Button variant="outline-secondary" onClick={onSearch}>
        Search
      </Button>
    </InputGroup>
  );
}
