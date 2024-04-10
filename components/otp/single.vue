<template>
	<div style="display: flex; align-items: center">
		<input
			ref="input"
			v-model="model"
			data-test="single-input"
			:type="inputTypeValue"
			:inputmode="inputmode"
			:placeholder="placeholder"
			:disabled="isDisabled"
			min="0"
			max="9"
			maxlength="1"
			pattern="[0-9]"
			:class="[inputClasses, conditionalClass, { 'is-complete': model }]"
			@input="handleOnChange"
			@keydown="handleOnKeyDown"
			@paste="handleOnPaste"
			@focus="handleOnFocus"
			@blur="handleOnBlur"
		/>
	</div>
</template>

<script lang="ts">
export default defineComponent({
	name: "SingleOtpInput",
	props: {
		inputType: {
			type: String as PropType<
				"number" | "tel" | "letter-numeric" | "password"
			>,
			validator: (value: string) =>
				["number", "tel", "letter-numeric", "password"].includes(value),
			default: "tel",
		},
		inputmode: {
			type: String as PropType<
				| "none"
				| "text"
				| "tel"
				| "url"
				| "email"
				| "numeric"
				| "decimal"
				| "search"
			>,
			default: "numeric",
		},
		value: {
			type: [String, Number],
			default: "",
		},
		separator: {
			type: String,
			default: "",
		},
		focus: {
			type: Boolean,
		},
		inputClasses: {
			type: [String, Array] as PropType<string[] | string>,
			default: "",
		},
		conditionalClass: {
			type: String,
			default: "",
		},
		shouldAutoFocus: {
			type: Boolean,
		},
		isLastChild: {
			type: Boolean,
		},
		placeholder: {
			type: String,
			default: "",
		},
		isDisabled: {
			type: Boolean,
		},
	},
	emits: ["on-change", "on-keydown", "on-paste", "on-focus", "on-blur"],
	setup(props, { emit }) {
		const model = ref<string | number>(props.value || "");
		const input = ref<HTMLInputElement | null>(null);

		const handleOnChange = () => {
			model.value = model.value.toString();
			if (model.value.toString().length > 1) {
				model.value = model.value.toString().slice(0, 1);
			}
			emit("on-change", model.value);
		};

		const isCodeLetter = (charCode: number) => charCode >= 65 && charCode <= 90;
		const isCodeNumeric = (charCode: number) =>
			(charCode >= 48 && charCode <= 57) || (charCode >= 96 && charCode <= 105);

		const handleOnKeyDown = (event: KeyboardEvent) => {
			if (props.isDisabled) {
				event.preventDefault();
			}
			const keyEvent = event || window.event;
			const charCode = keyEvent.which ? keyEvent.which : keyEvent.keyCode;
			if (
				isCodeNumeric(charCode) ||
				(props.inputType === "letter-numeric" && isCodeLetter(charCode)) ||
				[8, 9, 13, 37, 39, 46, 86].includes(charCode)
			) {
				emit("on-keydown", event);
			} else {
				event.preventDefault();
			}
		};

		const handleOnPaste = (event: ClipboardEvent) => emit("on-paste", event);

		const handleOnFocus = () => {
			if (input.value) {
				input.value.select();
			}
			emit("on-focus");
		};

		const handleOnBlur = () => emit("on-blur");

		watch(
			() => props.value,
			(newValue, oldValue) => {
				if (newValue !== oldValue) {
					model.value = newValue as string | number;
				}
			}
		);

		watch(
			() => props.focus,
			(newFocusValue, oldFocusValue) => {
				if (oldFocusValue !== newFocusValue && input.value && props.focus) {
					input.value.focus();
					input.value.select();
				}
			}
		);

		onMounted(() => {
			if (input.value && props.focus && props.shouldAutoFocus) {
				input.value.focus();
				input.value.select();
			}
		});

		return {
			handleOnChange,
			handleOnKeyDown,
			handleOnPaste,
			handleOnFocus,
			handleOnBlur,
			input,
			model,
			inputTypeValue: ["letter-numeric", "number"].includes(props.inputType)
				? "text"
				: props.inputType,
		};
	},
});
</script>
