export const pgErrorCodes = {
  "10608": {
    message: "invalid_argument_for_xquery" as const,
    class: "10" as const,
  },
  "20000": {
    message: "case_not_found" as const,
    class: "20" as const,
  },
  "21000": {
    message: "cardinality_violation" as const,
    class: "21" as const,
  },
  "22000": {
    message: "data_exception" as const,
    class: "22" as const,
  },
  "22001": {
    message: "string_data_right_truncation" as const,
    class: "22" as const,
  },
  "22002": {
    message: "null_value_no_indicator_parameter" as const,
    class: "22" as const,
  },
  "22003": {
    message: "numeric_value_out_of_range" as const,
    class: "22" as const,
  },
  "22004": {
    message: "null_value_not_allowed" as const,
    class: "22" as const,
  },
  "22005": {
    message: "error_in_assignment" as const,
    class: "22" as const,
  },
  "22007": {
    message: "invalid_datetime_format" as const,
    class: "22" as const,
  },
  "22008": {
    message: "datetime_field_overflow" as const,
    class: "22" as const,
  },
  "22009": {
    message: "invalid_time_zone_displacement_value" as const,
    class: "22" as const,
  },
  "22010": {
    message: "invalid_indicator_parameter_value" as const,
    class: "22" as const,
  },
  "22011": {
    message: "substring_error" as const,
    class: "22" as const,
  },
  "22012": {
    message: "division_by_zero" as const,
    class: "22" as const,
  },
  "22013": {
    message: "invalid_preceding_or_following_size" as const,
    class: "22" as const,
  },
  "22014": {
    message: "invalid_argument_for_ntile_function" as const,
    class: "22" as const,
  },
  "22015": {
    message: "interval_field_overflow" as const,
    class: "22" as const,
  },
  "22016": {
    message: "invalid_argument_for_nth_value_function" as const,
    class: "22" as const,
  },
  "22018": {
    message: "invalid_character_value_for_cast" as const,
    class: "22" as const,
  },
  "22019": {
    message: "invalid_escape_character" as const,
    class: "22" as const,
  },
  "22021": {
    message: "character_not_in_repertoire" as const,
    class: "22" as const,
  },
  "22022": {
    message: "indicator_overflow" as const,
    class: "22" as const,
  },
  "22023": {
    message: "invalid_parameter_value" as const,
    class: "22" as const,
  },
  "22024": {
    message: "unterminated_c_string" as const,
    class: "22" as const,
  },
  "22025": {
    message: "invalid_escape_sequence" as const,
    class: "22" as const,
  },
  "22026": {
    message: "string_data_length_mismatch" as const,
    class: "22" as const,
  },
  "22027": {
    message: "trim_error" as const,
    class: "22" as const,
  },
  "22030": {
    message: "duplicate_json_object_key_value" as const,
    class: "22" as const,
  },
  "22031": {
    message: "invalid_argument_for_sql_json_datetime_function" as const,
    class: "22" as const,
  },
  "22032": {
    message: "invalid_json_text" as const,
    class: "22" as const,
  },
  "22033": {
    message: "invalid_sql_json_subscript" as const,
    class: "22" as const,
  },
  "22034": {
    message: "more_than_one_sql_json_item" as const,
    class: "22" as const,
  },
  "22035": {
    message: "no_sql_json_item" as const,
    class: "22" as const,
  },
  "22036": {
    message: "non_numeric_sql_json_item" as const,
    class: "22" as const,
  },
  "22037": {
    message: "non_unique_keys_in_a_json_object" as const,
    class: "22" as const,
  },
  "22038": {
    message: "singleton_sql_json_item_required" as const,
    class: "22" as const,
  },
  "22039": {
    message: "sql_json_array_not_found" as const,
    class: "22" as const,
  },
  "23000": {
    message: "integrity_constraint_violation" as const,
    class: "23" as const,
  },
  "23001": {
    message: "restrict_violation" as const,
    class: "23" as const,
  },
  "23502": {
    message: "not_null_violation" as const,
    class: "23" as const,
  },
  "23503": {
    message: "foreign_key_violation" as const,
    class: "23" as const,
  },
  "23505": {
    message: "unique_violation" as const,
    class: "23" as const,
  },
  "23514": {
    message: "check_violation" as const,
    class: "23" as const,
  },
  "24000": {
    message: "invalid_cursor_state" as const,
    class: "24" as const,
  },
  "25000": {
    message: "invalid_transaction_state" as const,
    class: "25" as const,
  },
  "25001": {
    message: "active_sql_transaction" as const,
    class: "25" as const,
  },
  "25002": {
    message: "branch_transaction_already_active" as const,
    class: "25" as const,
  },
  "25003": {
    message: "inappropriate_access_mode_for_branch_transaction" as const,
    class: "25" as const,
  },
  "25004": {
    message: "inappropriate_isolation_level_for_branch_transaction" as const,
    class: "25" as const,
  },
  "25005": {
    message: "no_active_sql_transaction_for_branch_transaction" as const,
    class: "25" as const,
  },
  "25006": {
    message: "read_only_sql_transaction" as const,
    class: "25" as const,
  },
  "25007": {
    message: "schema_and_data_statement_mixing_not_supported" as const,
    class: "25" as const,
  },
  "25008": {
    message: "held_cursor_requires_same_isolation_level" as const,
    class: "25" as const,
  },
  "26000": {
    message: "invalid_sql_statement_name" as const,
    class: "26" as const,
  },
  "27000": {
    message: "triggered_data_change_violation" as const,
    class: "27" as const,
  },
  "28000": {
    message: "invalid_authorization_specification" as const,
    class: "28" as const,
  },
  "34000": {
    message: "invalid_cursor_name" as const,
    class: "34" as const,
  },
  "38000": {
    message: "external_routine_exception" as const,
    class: "38" as const,
  },
  "38001": {
    message: "containing_sql_not_permitted" as const,
    class: "38" as const,
  },
  "38002": {
    message: "modifying_sql_data_not_permitted" as const,
    class: "38" as const,
  },
  "38003": {
    message: "prohibited_sql_statement_attempted" as const,
    class: "38" as const,
  },
  "38004": {
    message: "reading_sql_data_not_permitted" as const,
    class: "38" as const,
  },
  "39000": {
    message: "external_routine_invocation_exception" as const,
    class: "39" as const,
  },
  "39001": {
    message: "invalid_sqlstate_returned" as const,
    class: "39" as const,
  },
  "39004": {
    message: "null_value_not_allowed" as const,
    class: "39" as const,
  },
  "40000": {
    message: "transaction_rollback" as const,
    class: "40" as const,
  },
  "40001": {
    message: "serialization_failure" as const,
    class: "40" as const,
  },
  "40002": {
    message: "transaction_integrity_constraint_violation" as const,
    class: "40" as const,
  },
  "40003": {
    message: "statement_completion_unknown" as const,
    class: "40" as const,
  },
  "42000": {
    message: "syntax_error_or_access_rule_violation" as const,
    class: "42" as const,
  },
  "42501": {
    message: "insufficient_privilege" as const,
    class: "42" as const,
  },
  "42601": {
    message: "syntax_error" as const,
    class: "42" as const,
  },
  "42602": {
    message: "invalid_name" as const,
    class: "42" as const,
  },
  "42611": {
    message: "invalid_column_definition" as const,
    class: "42" as const,
  },
  "42622": {
    message: "name_too_long" as const,
    class: "42" as const,
  },
  "42701": {
    message: "duplicate_column" as const,
    class: "42" as const,
  },
  "42702": {
    message: "ambiguous_column" as const,
    class: "42" as const,
  },
  "42703": {
    message: "undefined_column" as const,
    class: "42" as const,
  },
  "42704": {
    message: "undefined_object" as const,
    class: "42" as const,
  },
  "42710": {
    message: "duplicate_object" as const,
    class: "42" as const,
  },
  "42712": {
    message: "duplicate_alias" as const,
    class: "42" as const,
  },
  "42723": {
    message: "duplicate_function" as const,
    class: "42" as const,
  },
  "42725": {
    message: "ambiguous_function" as const,
    class: "42" as const,
  },
  "42803": {
    message: "grouping_error" as const,
    class: "42" as const,
  },
  "42804": {
    message: "dataclass_mismatch" as const,
    class: "42" as const,
  },
  "42809": {
    message: "wrong_object_class" as const,
    class: "42" as const,
  },
  "42830": {
    message: "invalid_foreign_key" as const,
    class: "42" as const,
  },
  "42846": {
    message: "cannot_coerce" as const,
    class: "42" as const,
  },
  "42883": {
    message: "undefined_function" as const,
    class: "42" as const,
  },
  "42939": {
    message: "reserved_name" as const,
    class: "42" as const,
  },
  "44000": {
    message: "with_check_option_violation" as const,
    class: "44" as const,
  },
  "53000": {
    message: "insufficient_resources" as const,
    class: "53" as const,
  },
  "53100": {
    message: "disk_full" as const,
    class: "53" as const,
  },
  "53200": {
    message: "out_of_memory" as const,
    class: "53" as const,
  },
  "53300": {
    message: "too_many_connections" as const,
    class: "53" as const,
  },
  "53400": {
    message: "configuration_limit_exceeded" as const,
    class: "53" as const,
  },
  "54000": {
    message: "program_limit_exceeded" as const,
    class: "54" as const,
  },
  "54001": {
    message: "statement_too_complex" as const,
    class: "54" as const,
  },
  "54011": {
    message: "too_many_columns" as const,
    class: "54" as const,
  },
  "54023": {
    message: "too_many_arguments" as const,
    class: "54" as const,
  },
  "55000": {
    message: "object_not_in_prerequisite_state" as const,
    class: "55" as const,
  },
  "55006": {
    message: "object_in_use" as const,
    class: "55" as const,
  },
  "57000": {
    message: "operator_intervention" as const,
    class: "57" as const,
  },
  "57014": {
    message: "query_canceled" as const,
    class: "57" as const,
  },
  "58000": {
    message: "system_error" as const,
    class: "58" as const,
  },
  "58030": {
    message: "io_error" as const,
    class: "58" as const,
  },
  "00000": {
    message: "successful_completion" as const,
    class: "00" as const,
  },
  "01000": {
    message: "warning" as const,
    class: "01" as const,
  },
  "0100C": {
    message: "dynamic_result_sets_returned" as const,
    class: "01" as const,
  },
  "01008": {
    message: "implicit_zero_bit_padding" as const,
    class: "01" as const,
  },
  "01003": {
    message: "null_value_eliminated_in_set_function" as const,
    class: "01" as const,
  },
  "01007": {
    message: "privilege_not_granted" as const,
    class: "01" as const,
  },
  "01006": {
    message: "privilege_not_revoked" as const,
    class: "01" as const,
  },
  "01004": {
    message: "string_data_right_truncation" as const,
    class: "01" as const,
  },
  "01P01": {
    message: "deprecated_feature" as const,
    class: "01" as const,
  },
  "02000": {
    message: "no_data" as const,
    class: "02" as const,
  },
  "02001": {
    message: "no_additional_dynamic_result_sets_returned" as const,
    class: "02" as const,
  },
  "03000": {
    message: "sql_statement_not_yet_complete" as const,
    class: "03" as const,
  },
  "08000": {
    message: "connection_exception" as const,
    class: "08" as const,
  },
  "08003": {
    message: "connection_does_not_exist" as const,
    class: "08" as const,
  },
  "08006": {
    message: "connection_failure" as const,
    class: "08" as const,
  },
  "08001": {
    message: "sqlclient_unable_to_establish_sqlconnection" as const,
    class: "08" as const,
  },
  "08004": {
    message: "sqlserver_rejected_establishment_of_sqlconnection" as const,
    class: "08" as const,
  },
  "08007": {
    message: "transaction_resolution_unknown" as const,
    class: "08" as const,
  },
  "08P01": {
    message: "protocol_violation" as const,
    class: "08" as const,
  },
  "09000": {
    message: "triggered_action_exception" as const,
    class: "09" as const,
  },
  "0A000": {
    message: "feature_not_supported" as const,
    class: "0A" as const,
  },
  "0B000": {
    message: "invalid_transaction_initiation" as const,
    class: "0B" as const,
  },
  "0F000": {
    message: "locator_exception" as const,
    class: "0F" as const,
  },
  "0F001": {
    message: "invalid_locator_specification" as const,
    class: "0F" as const,
  },
  "0L000": {
    message: "invalid_grantor" as const,
    class: "0L" as const,
  },
  "0LP01": {
    message: "invalid_grant_operation" as const,
    class: "0L" as const,
  },
  "0P000": {
    message: "invalid_role_specification" as const,
    class: "0P" as const,
  },
  "0Z000": {
    message: "diagnostics_exception" as const,
    class: "0Z" as const,
  },
  "0Z002": {
    message: "stacked_diagnostics_accessed_without_active_handler" as const,
    class: "0Z" as const,
  },
  "2202E": {
    message: "array_subscript_error" as const,
    class: "22" as const,
  },
  "2200B": {
    message: "escape_character_conflict" as const,
    class: "22" as const,
  },
  "2201E": {
    message: "invalid_argument_for_logarithm" as const,
    class: "22" as const,
  },
  "2201F": {
    message: "invalid_argument_for_power_function" as const,
    class: "22" as const,
  },
  "2201G": {
    message: "invalid_argument_for_width_bucket_function" as const,
    class: "22" as const,
  },
  "2200D": {
    message: "invalid_escape_octet" as const,
    class: "22" as const,
  },
  "22P06": {
    message: "nonstandard_use_of_escape_character" as const,
    class: "22" as const,
  },
  "2201B": {
    message: "invalid_regular_expression" as const,
    class: "22" as const,
  },
  "2201W": {
    message: "invalid_row_count_in_limit_clause" as const,
    class: "22" as const,
  },
  "2201X": {
    message: "invalid_row_count_in_result_offset_clause" as const,
    class: "22" as const,
  },
  "2202H": {
    message: "invalid_tablesample_argument" as const,
    class: "22" as const,
  },
  "2202G": {
    message: "invalid_tablesample_repeat" as const,
    class: "22" as const,
  },
  "2200C": {
    message: "invalid_use_of_escape_character" as const,
    class: "22" as const,
  },
  "2200G": {
    message: "most_specific_class_mismatch" as const,
    class: "22" as const,
  },
  "2200H": {
    message: "sequence_generator_limit_exceeded" as const,
    class: "22" as const,
  },
  "2200F": {
    message: "zero_length_character_string" as const,
    class: "22" as const,
  },
  "22P01": {
    message: "floating_point_exception" as const,
    class: "22" as const,
  },
  "22P02": {
    message: "invalid_text_representation" as const,
    class: "22" as const,
  },
  "22P03": {
    message: "invalid_binary_representation" as const,
    class: "22" as const,
  },
  "22P04": {
    message: "bad_copy_file_format" as const,
    class: "22" as const,
  },
  "22P05": {
    message: "untranslatable_character" as const,
    class: "22" as const,
  },
  "2200L": {
    message: "not_an_xml_document" as const,
    class: "22" as const,
  },
  "2200M": {
    message: "invalid_xml_document" as const,
    class: "22" as const,
  },
  "2200N": {
    message: "invalid_xml_content" as const,
    class: "22" as const,
  },
  "2200S": {
    message: "invalid_xml_comment" as const,
    class: "22" as const,
  },
  "2200T": {
    message: "invalid_xml_processing_instruction" as const,
    class: "22" as const,
  },
  "2203A": {
    message: "sql_json_member_not_found" as const,
    class: "22" as const,
  },
  "2203B": {
    message: "sql_json_number_not_found" as const,
    class: "22" as const,
  },
  "2203C": {
    message: "sql_json_object_not_found" as const,
    class: "22" as const,
  },
  "2203D": {
    message: "too_many_json_array_elements" as const,
    class: "22" as const,
  },
  "2203E": {
    message: "too_many_json_object_members" as const,
    class: "22" as const,
  },
  "2203F": {
    message: "sql_json_scalar_required" as const,
    class: "22" as const,
  },
  "2203G": {
    message: "sql_json_item_cannot_be_cast_to_target_class" as const,
    class: "22" as const,
  },
  "23P01": {
    message: "exclusion_violation" as const,
    class: "23" as const,
  },
  "25P01": {
    message: "no_active_sql_transaction" as const,
    class: "25" as const,
  },
  "25P02": {
    message: "in_failed_sql_transaction" as const,
    class: "25" as const,
  },
  "25P03": {
    message: "idle_in_transaction_session_timeout" as const,
    class: "25" as const,
  },
  "25P04": {
    message: "transaction_timeout" as const,
    class: "25" as const,
  },
  "28P01": {
    message: "invalid_password" as const,
    class: "28" as const,
  },
  "2B000": {
    message: "dependent_privilege_descriptors_still_exist" as const,
    class: "2B" as const,
  },
  "2BP01": {
    message: "dependent_objects_still_exist" as const,
    class: "2B" as const,
  },
  "2D000": {
    message: "invalid_transaction_termination" as const,
    class: "2D" as const,
  },
  "2F000": {
    message: "sql_routine_exception" as const,
    class: "2F" as const,
  },
  "2F005": {
    message: "function_executed_no_return_statement" as const,
    class: "2F" as const,
  },
  "2F002": {
    message: "modifying_sql_data_not_permitted" as const,
    class: "2F" as const,
  },
  "2F003": {
    message: "prohibited_sql_statement_attempted" as const,
    class: "2F" as const,
  },
  "2F004": {
    message: "reading_sql_data_not_permitted" as const,
    class: "2F" as const,
  },
  "39P01": {
    message: "trigger_protocol_violated" as const,
    class: "39" as const,
  },
  "39P02": {
    message: "srf_protocol_violated" as const,
    class: "39" as const,
  },
  "39P03": {
    message: "event_trigger_protocol_violated" as const,
    class: "39" as const,
  },
  "3B000": {
    message: "savepoint_exception" as const,
    class: "3B" as const,
  },
  "3B001": {
    message: "invalid_savepoint_specification" as const,
    class: "3B" as const,
  },
  "3D000": {
    message: "invalid_catalog_name" as const,
    class: "3D" as const,
  },
  "3F000": {
    message: "invalid_schema_name" as const,
    class: "3F" as const,
  },
  "40P01": {
    message: "deadlock_detected" as const,
    class: "40" as const,
  },
  "42P20": {
    message: "windowing_error" as const,
    class: "42" as const,
  },
  "42P19": {
    message: "invalid_recursion" as const,
    class: "42" as const,
  },
  "42P18": {
    message: "indeterminate_dataclass" as const,
    class: "42" as const,
  },
  "42P21": {
    message: "collation_mismatch" as const,
    class: "42" as const,
  },
  "42P22": {
    message: "indeterminate_collation" as const,
    class: "42" as const,
  },
  "428C9": {
    message: "generated_always" as const,
    class: "42" as const,
  },
  "42P01": {
    message: "undefined_table" as const,
    class: "42" as const,
  },
  "42P02": {
    message: "undefined_parameter" as const,
    class: "42" as const,
  },
  "42P03": {
    message: "duplicate_cursor" as const,
    class: "42" as const,
  },
  "42P04": {
    message: "duplicate_database" as const,
    class: "42" as const,
  },
  "42P05": {
    message: "duplicate_prepared_statement" as const,
    class: "42" as const,
  },
  "42P06": {
    message: "duplicate_schema" as const,
    class: "42" as const,
  },
  "42P07": {
    message: "duplicate_table" as const,
    class: "42" as const,
  },
  "42P08": {
    message: "ambiguous_parameter" as const,
    class: "42" as const,
  },
  "42P09": {
    message: "ambiguous_alias" as const,
    class: "42" as const,
  },
  "42P10": {
    message: "invalid_column_reference" as const,
    class: "42" as const,
  },
  "42P11": {
    message: "invalid_cursor_definition" as const,
    class: "42" as const,
  },
  "42P12": {
    message: "invalid_database_definition" as const,
    class: "42" as const,
  },
  "42P13": {
    message: "invalid_function_definition" as const,
    class: "42" as const,
  },
  "42P14": {
    message: "invalid_prepared_statement_definition" as const,
    class: "42" as const,
  },
  "42P15": {
    message: "invalid_schema_definition" as const,
    class: "42" as const,
  },
  "42P16": {
    message: "invalid_table_definition" as const,
    class: "42" as const,
  },
  "42P17": {
    message: "invalid_object_definition" as const,
    class: "42" as const,
  },
  "55P02": {
    message: "cant_change_runtime_param" as const,
    class: "55" as const,
  },
  "55P03": {
    message: "lock_not_available" as const,
    class: "55" as const,
  },
  "55P04": {
    message: "unsafe_new_enum_value_usage" as const,
    class: "55" as const,
  },
  "57P01": {
    message: "admin_shutdown" as const,
    class: "57" as const,
  },
  "57P02": {
    message: "crash_shutdown" as const,
    class: "57" as const,
  },
  "57P03": {
    message: "cannot_connect_now" as const,
    class: "57" as const,
  },
  "57P04": {
    message: "database_dropped" as const,
    class: "57" as const,
  },
  "57P05": {
    message: "idle_session_timeout" as const,
    class: "57" as const,
  },
  "58P01": {
    message: "undefined_file" as const,
    class: "58" as const,
  },
  "58P02": {
    message: "duplicate_file" as const,
    class: "58" as const,
  },
  "58P03": {
    message: "file_name_too_long" as const,
    class: "58" as const,
  },
  F0000: {
    message: "config_file_error" as const,
    class: "F0" as const,
  },
  F0001: {
    message: "lock_file_exists" as const,
    class: "F0" as const,
  },
  HV000: {
    message: "fdw_error" as const,
    class: "HV" as const,
  },
  HV005: {
    message: "fdw_column_name_not_found" as const,
    class: "HV" as const,
  },
  HV002: {
    message: "fdw_dynamic_parameter_value_needed" as const,
    class: "HV" as const,
  },
  HV010: {
    message: "fdw_function_sequence_error" as const,
    class: "HV" as const,
  },
  HV021: {
    message: "fdw_inconsistent_descriptor_information" as const,
    class: "HV" as const,
  },
  HV024: {
    message: "fdw_invalid_attribute_value" as const,
    class: "HV" as const,
  },
  HV007: {
    message: "fdw_invalid_column_name" as const,
    class: "HV" as const,
  },
  HV008: {
    message: "fdw_invalid_column_number" as const,
    class: "HV" as const,
  },
  HV004: {
    message: "fdw_invalid_data_class" as const,
    class: "HV" as const,
  },
  HV006: {
    message: "fdw_invalid_data_class_descriptors" as const,
    class: "HV" as const,
  },
  HV091: {
    message: "fdw_invalid_descriptor_field_identifier" as const,
    class: "HV" as const,
  },
  HV00B: {
    message: "fdw_invalid_handle" as const,
    class: "HV" as const,
  },
  HV00C: {
    message: "fdw_invalid_option_index" as const,
    class: "HV" as const,
  },
  HV00D: {
    message: "fdw_invalid_option_name" as const,
    class: "HV" as const,
  },
  HV090: {
    message: "fdw_invalid_string_length_or_buffer_length" as const,
    class: "HV" as const,
  },
  HV00A: {
    message: "fdw_invalid_string_format" as const,
    class: "HV" as const,
  },
  HV009: {
    message: "fdw_invalid_use_of_null_pointer" as const,
    class: "HV" as const,
  },
  HV014: {
    message: "fdw_too_many_handles" as const,
    class: "HV" as const,
  },
  HV001: {
    message: "fdw_out_of_memory" as const,
    class: "HV" as const,
  },
  HV00P: {
    message: "fdw_no_schemas" as const,
    class: "HV" as const,
  },
  HV00J: {
    message: "fdw_option_name_not_found" as const,
    class: "HV" as const,
  },
  HV00K: {
    message: "fdw_reply_handle" as const,
    class: "HV" as const,
  },
  HV00Q: {
    message: "fdw_schema_not_found" as const,
    class: "HV" as const,
  },
  HV00R: {
    message: "fdw_table_not_found" as const,
    class: "HV" as const,
  },
  HV00L: {
    message: "fdw_unable_to_create_execution" as const,
    class: "HV" as const,
  },
  HV00M: {
    message: "fdw_unable_to_create_reply" as const,
    class: "HV" as const,
  },
  HV00N: {
    message: "fdw_unable_to_establish_connection" as const,
    class: "HV" as const,
  },
  P0000: {
    message: "plpgsql_error" as const,
    class: "P0" as const,
  },
  P0001: {
    message: "raise_exception" as const,
    class: "P0" as const,
  },
  P0002: {
    message: "no_data_found" as const,
    class: "P0" as const,
  },
  P0003: {
    message: "too_many_rows" as const,
    class: "P0" as const,
  },
  P0004: {
    message: "assert_failure" as const,
    class: "P0" as const,
  },
  XX000: {
    message: "internal_error" as const,
    class: "XX" as const,
  },
  XX001: {
    message: "data_corrupted" as const,
    class: "XX" as const,
  },
  XX002: {
    message: "index_corrupted" as const,
    class: "XX" as const,
  },
};

export type PgErrorCode = keyof typeof pgErrorCodes;
export type PgErrorMessage = (typeof pgErrorCodes)[PgErrorCode]["message"];
