"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Character, characterSchema, races, professions } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function CharacterForm() {
    // 初始化表單
    const form = useForm<Character>({
        resolver: zodResolver(characterSchema),
        defaultValues: {
            name: "",
            race: undefined,
            profession: undefined,
            attributes: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
            },
        },
    });

    const onSubmit = (data: Character) => {
        console.log("角色資料: ",data);
        alert(`Player「${data.name}」has been created successfully!`);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* name */}
                    <Field>
                        <FieldLabel htmlFor="name">Name</FieldLabel>
                        <Controller
                            name="name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Input
                                    id="name"
                                    placeholder="Enter your character's name"
                                    {...field}
                                    aria-invalid={fieldState.invalid}
                                />
                            )}
                        />
                        <FieldError>{form.formState.errors.name?.message}</FieldError>
                    </Field>
                    {/* races */}
                    <Field>
                        <FieldLabel htmlFor="race">Race</FieldLabel>
                        <Controller
                            name="race"
                            control={form.control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="race">
                                        <SelectValue placeholder="Select your character's race" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {races.map((race) => (
                                            <SelectItem key={race} value={race}>
                                                {race}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        <FieldError>{form.formState.errors.race?.message}</FieldError>
                    </Field>
                    {/* professions */}
                    <Field>
                        <FieldLabel htmlFor="profession">Profession</FieldLabel>
                        <Controller
                            name="profession"
                            control={form.control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="profession">
                                        <SelectValue placeholder="Select your character's profession" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {professions.map((profession) => (
                                            <SelectItem key={profession} value={profession}>
                                                {profession}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        <FieldError>{form.formState.errors.profession?.message}</FieldError>
                    </Field>
                </CardContent>
            </Card>

            <Button type="submit" className="w-full">Create Character</Button>
        </form>
    );
}