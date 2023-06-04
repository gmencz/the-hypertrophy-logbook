import type { FieldConfig } from "@conform-to/react";
import { conform, list, useFieldList, useFieldset } from "@conform-to/react";
import type { loader } from "./route";
import type { RefObject } from "react";
import { useRef } from "react";
import { Disclosure } from "@headlessui/react";
import {
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { SetFieldset } from "./set-fieldset";
import { Textarea } from "~/components/textarea";
import { ExercisesAutocomplete } from "~/components/exercises-autocomplete";
import { useLoaderData } from "@remix-run/react";
import type { Schema } from "./schema";

type ExerciseFieldsetProps = {
  config: FieldConfig<Schema["trainingDays"][number]["exercises"][number]>;
  exercisesConfig: FieldConfig<Schema["trainingDays"][number]["exercises"]>;
  index: number;
  formRef: RefObject<HTMLFormElement>;
  dayNumber: number;
};

export function ExerciseFieldset(props: ExerciseFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { id, dayNumber, notes, sets } = useFieldset(ref, props.config);
  const setsList = useFieldList(props.formRef, sets);
  const disclosureButtonRef = useRef<HTMLButtonElement>(null);
  const { exercises } = useLoaderData<typeof loader>();

  return (
    <fieldset className="relative" ref={ref}>
      <input {...conform.input(dayNumber, { hidden: true })} />

      <button
        className="absolute -top-1 right-0 flex items-center justify-center rounded-md border-0 bg-red-50 p-1 text-sm font-medium text-red-700 ring-1 ring-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600"
        {...list.remove(props.exercisesConfig.name, { index: props.index })}
      >
        <TrashIcon className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Delete exercise</span>
      </button>

      <ExercisesAutocomplete
        exercises={exercises}
        dayNumber={props.dayNumber}
        exerciseNumber={props.index + 1}
        fieldConfig={id}
      />

      <Disclosure defaultOpen>
        <Disclosure.Button
          ref={disclosureButtonRef}
          className="mb-3 mt-4 flex w-full items-center justify-center rounded bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {({ open }) => (
            <>
              {open ? (
                <>
                  <EyeSlashIcon
                    className="-ml-0.5 mr-2 h-5 w-5"
                    aria-hidden="true"
                  />
                  <span>Hide details</span>
                </>
              ) : (
                <>
                  <EyeIcon
                    className="-ml-0.5 mr-2 h-5 w-5"
                    aria-hidden="true"
                  />
                  <span>Show details</span>
                </>
              )}
            </>
          )}
        </Disclosure.Button>
        <Disclosure.Panel className="mb-6" unmount={false}>
          <ol className="mt-4 flex flex-col gap-4">
            {setsList.map((set, index) => (
              <li key={set.key}>
                <SetFieldset
                  setsConfig={sets}
                  config={set}
                  setNumber={index + 1}
                />
              </li>
            ))}
          </ol>

          {sets.error ? (
            <p
              className="mt-2 text-sm text-red-500"
              id={sets.errorId}
              role="alert"
            >
              {sets.error}
            </p>
          ) : null}

          {setsList.length < 10 ? (
            <button
              className="mt-5 flex w-full items-center justify-center rounded bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
              {...list.append(sets.name, {
                defaultValue: { rir: "0", repRange: "5-8", weight: "" },
              })}
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Add set
            </button>
          ) : null}

          <div className="mt-6">
            <Textarea
              rows={4}
              label="Notes (Optional)"
              config={notes}
              placeholder="Seat on 4th setting, handles on 3rd setting..."
            />
          </div>
        </Disclosure.Panel>
      </Disclosure>
    </fieldset>
  );
}